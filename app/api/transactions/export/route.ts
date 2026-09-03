import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildTransactionWhereInput } from '@/lib/transactionFilters';

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/transactions/export
 *
 * Exports filtered transaction records as CSV.
 * Uses the exact same server-side filters as GET /api/transactions.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { where, todayUTCMidnight, todayISO } = buildTransactionWhereInput(searchParams);

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

    const headers = [
      'Transaction ID',
      'Book Title',
      'Book Author',
      'Borrower Name',
      'Membership Number',
      'Status',
      'Issue Date',
      'Due Date',
      'Return Date',
      'Overdue Status',
    ];

    const rows = transactions.map((tx) => {
      // Overdue means only an active ISSUED transaction whose calendar due date is before today
      const isOverdue = tx.status === 'ISSUED' && tx.dueDate < todayUTCMidnight;
      const overdueStatus = isOverdue ? 'Overdue' : 'On Time';

      const issueDate = tx.issuedAt ? new Date(tx.issuedAt).toISOString().slice(0, 10) : '';
      const dueDate = tx.dueDate ? new Date(tx.dueDate).toISOString().slice(0, 10) : '';
      const returnDate = tx.returnedAt ? new Date(tx.returnedAt).toISOString().slice(0, 10) : '';

      return [
        tx.id,
        tx.book?.title ?? '',
        tx.book?.author ?? '',
        tx.borrower?.fullName ?? '',
        tx.borrower?.membershipNumber ?? '',
        tx.status,
        issueDate,
        dueDate,
        returnDate,
        overdueStatus,
      ].map(escapeCSVField).join(',');
    });

    const csvContent = [headers.map(escapeCSVField).join(','), ...rows].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="library-transactions-${todayISO}.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error exporting transactions CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions CSV from database' },
      { status: 500 }
    );
  }
}
