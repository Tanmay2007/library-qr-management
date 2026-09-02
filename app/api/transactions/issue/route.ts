import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookId, borrowerId, dueDate } = body;

    // Validate required fields
    if (!bookId || !bookId.trim() || !borrowerId || !borrowerId.trim() || !dueDate || !dueDate.trim()) {
      return NextResponse.json(
        { error: 'Book ID, Borrower ID, and Due Date are required.' },
        { status: 400 }
      );
    }

    // Validate due date
    const parsedDueDate = new Date(dueDate.trim());
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date provided.' },
        { status: 400 }
      );
    }

    const now = new Date();
    // Allow today's future time or future dates
    if (parsedDueDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'Due date must be set to a valid future date.' },
        { status: 400 }
      );
    }

    const cleanBookId = bookId.trim();
    const cleanBorrowerId = borrowerId.trim();

    // Execute atomic transaction for safe inventory decrement and loan creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify book exists
      const book = await tx.book.findUnique({
        where: { id: cleanBookId },
      });

      if (!book) {
        throw { status: 404, message: 'Book not found in library registry.' };
      }

      // 2. Verify borrower exists
      const borrower = await tx.borrower.findUnique({
        where: { id: cleanBorrowerId },
      });

      if (!borrower) {
        throw { status: 404, message: 'Borrower not found in patron registry.' };
      }

      // 3. Prevent issue if no copies available
      if (book.availableCopies <= 0) {
        throw {
          status: 409,
          message: `No available copies of "${book.title}" are currently in stock to issue.`,
        };
      }

      // 4. Prevent duplicate active loan for same borrower + book
      const existingActiveLoan = await tx.transaction.findFirst({
        where: {
          bookId: cleanBookId,
          borrowerId: cleanBorrowerId,
          status: 'ISSUED',
        },
      });

      if (existingActiveLoan) {
        throw {
          status: 409,
          message: `Patron "${borrower.fullName}" already has an active loan for "${book.title}".`,
        };
      }

      // 5. Decrement available copies atomically with condition guard
      const updatedBook = await tx.book.update({
        where: {
          id: cleanBookId,
          availableCopies: { gt: 0 },
        },
        data: {
          availableCopies: { decrement: 1 },
        },
      });

      // 6. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          bookId: cleanBookId,
          borrowerId: cleanBorrowerId,
          status: 'ISSUED',
          issuedAt: new Date(),
          dueDate: parsedDueDate,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
              category: true,
              availableCopies: true,
              totalCopies: true,
              qrCode: true,
            },
          },
          borrower: {
            select: {
              id: true,
              fullName: true,
              email: true,
              membershipNumber: true,
            },
          },
        },
      });

      return { transaction, updatedBook };
    });

    return NextResponse.json(result.transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error issuing book loan:', error);

    if (error.status && error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Cannot issue book: No available copies remaining in stock.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred while processing the loan.' },
      { status: 500 }
    );
  }
}
