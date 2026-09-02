import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(books);
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, isbn, category, totalCopies } = body;

    // Validate required fields
    if (!title || !title.trim() || !author || !author.trim() || !isbn || !isbn.trim() || !category || !totalCopies) {
      return NextResponse.json(
        { error: 'Title, author, ISBN, category, and total copies are required fields.' },
        { status: 400 }
      );
    }

    const parsedCopies = parseInt(totalCopies, 10);
    if (isNaN(parsedCopies) || parsedCopies < 1) {
      return NextResponse.json(
        { error: 'Total copies must be a positive integer.' },
        { status: 400 }
      );
    }

    // Generate unique internal QR payload
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const qrCode = `LIB-BOOK-${timestamp}-${randomSuffix}`;

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        totalCopies: parsedCopies,
        availableCopies: parsedCopies, // Set equal to totalCopies on creation
        qrCode,
      },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);

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
        { error: 'A book with this ISBN or QR code payload already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating the book.' },
      { status: 500 }
    );
  }
}
