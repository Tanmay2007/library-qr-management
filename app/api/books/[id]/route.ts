import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { title, author, isbn, category, totalCopies } = body;

    // Validate required fields
    if (
      !title ||
      !title.trim() ||
      !author ||
      !author.trim() ||
      !isbn ||
      !isbn.trim() ||
      !category ||
      totalCopies === undefined ||
      totalCopies === null ||
      totalCopies === ''
    ) {
      return NextResponse.json(
        { error: 'Title, author, ISBN, category, and total copies are required fields.' },
        { status: 400 }
      );
    }

    const parsedCopies = parseInt(String(totalCopies), 10);
    if (isNaN(parsedCopies) || parsedCopies < 1) {
      return NextResponse.json(
        { error: 'Total copies must be a whole number greater than 0.' },
        { status: 400 }
      );
    }

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found.' },
        { status: 404 }
      );
    }

    // Circulation safety calculation
    const issuedCopies = existingBook.totalCopies - existingBook.availableCopies;
    if (parsedCopies < issuedCopies) {
      return NextResponse.json(
        {
          error: `Total copies cannot be less than the number of copies currently issued (${issuedCopies}).`,
        },
        { status: 400 }
      );
    }

    const newAvailableCopies = parsedCopies - issuedCopies;

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        totalCopies: parsedCopies,
        availableCopies: newAvailableCopies,
      },
    });

    return NextResponse.json(updatedBook);
  } catch (error: any) {
    console.error('Error updating book:', error);

    // Handle Prisma unique constraint violation (code P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes('isbn')) {
        return NextResponse.json(
          { error: 'A book with this ISBN already exists in the database.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'A book with this ISBN already exists in the database.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating the book.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required.' }, { status: 400 });
    }

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Check if the book has related transaction records
    const transactionCount = await prisma.transaction.count({
      where: { bookId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error:
            'This book cannot be deleted because it has active or historical circulation transaction records that must be preserved.',
        },
        { status: 409 }
      );
    }

    await prisma.book.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while deleting the book.' },
      { status: 500 }
    );
  }
}
