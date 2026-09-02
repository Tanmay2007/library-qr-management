import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode')?.trim();

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code parameter is required.' },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { qrCode },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        category: true,
        totalCopies: true,
        availableCopies: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'QR code not recognized in library registry.' },
        { status: 404 }
      );
    }

    return NextResponse.json(book, { status: 200 });
  } catch (error: any) {
    console.error('Error looking up book by QR code:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred during lookup.' },
      { status: 500 }
    );
  }
}
