import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
      return NextResponse.json(
        { error: 'Transaction ID is required.' },
        { status: 400 }
      );
    }

    const cleanTransactionId = transactionId.trim();

    // Execute atomic Prisma transaction for safe return processing
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Find the transaction
      const existing = await tx.transaction.findUnique({
        where: { id: cleanTransactionId },
        include: {
          book: true,
          borrower: true,
        },
      });

      // Distinguish not found vs already returned
      if (!existing) {
        throw {
          status: 404,
          message: 'Transaction record not found in circulation registry.',
        };
      }

      if (existing.status === 'RETURNED') {
        throw {
          status: 409,
          message: `This book loan for "${existing.book.title}" was already returned on ${
            existing.returnedAt ? new Date(existing.returnedAt).toLocaleString() : 'a previous date'
          }.`,
        };
      }

      if (existing.status !== 'ISSUED') {
        throw {
          status: 409,
          message: 'Transaction is not in an active ISSUED state.',
        };
      }

      // 2. Atomically update transaction status with concurrency guard
      const returnedTx = await tx.transaction.update({
        where: {
          id: cleanTransactionId,
          status: 'ISSUED',
        },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
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

      // 3. Atomically increment the related book's available copies
      await tx.book.update({
        where: { id: existing.bookId },
        data: {
          availableCopies: { increment: 1 },
        },
      });

      return returnedTx;
    });

    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error: any) {
    console.error('Error processing book return:', error);

    if (error.status && error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'This transaction has already been returned or cannot be updated.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred while processing the return.' },
      { status: 500 }
    );
  }
}
