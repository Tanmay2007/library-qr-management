import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
