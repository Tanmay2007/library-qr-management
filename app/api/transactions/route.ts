import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/transactions
 *
 * Query Parameters:
 *   - status: 'ALL' | 'ISSUED' | 'RETURNED'
 *   - overdue: 'ALL' | 'ON_TIME' | 'OVERDUE'
 *   - from / fromDate / startDate: YYYY-MM-DD
 *   - to / toDate / endDate: YYYY-MM-DD
 *   - book / bookId: ID or title substring
 *   - borrower / borrowerId: ID, name substring, or membership number
 *
 * Overdue logic:
 *   Overdue means ONLY an active ISSUED transaction whose calendar due date
 *   is strictly before today. A loan due today is On Time.
 *   Uses date-only UTC midnight boundary to avoid timezone errors.
 */
import { buildTransactionWhereInput } from '@/lib/transactionFilters';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { where } = buildTransactionWhereInput(searchParams);

    const transactions = await prisma.transaction.findMany({
      where,
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

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history from database' },
      { status: 500 }
    );
  }
}
