import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode')?.trim();

    if (qrCode) {
      // Check if book exists with this exact qrCode
      const book = await prisma.book.findUnique({
        where: { qrCode },
      });

      if (!book) {
        return NextResponse.json(
          { error: 'QR code not recognized in library registry.' },
          { status: 404 }
        );
      }

      // Fetch active loans for this specific book
      const activeLoans = await prisma.transaction.findMany({
        where: {
          bookId: book.id,
          status: 'ISSUED',
        },
        orderBy: {
          issuedAt: 'desc',
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
              phone: true,
              membershipNumber: true,
            },
          },
        },
      });

      return NextResponse.json(activeLoans);
    }

    // Default: fetch all active loans
    const activeLoans = await prisma.transaction.findMany({
      where: {
        status: 'ISSUED',
      },
      orderBy: {
        issuedAt: 'desc',
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
            phone: true,
            membershipNumber: true,
          },
        },
      },
    });

    return NextResponse.json(activeLoans);
  } catch (error: any) {
    console.error('Error fetching active loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active loans from database' },
      { status: 500 }
    );
  }
}

