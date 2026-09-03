import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/dashboard
 *
 * Returns aggregated library statistics for the dashboard:
 *   - Book inventory totals (distinct titles, copy sums, on-loan count)
 *   - Registered borrower count
 *   - Active (ISSUED) loan count
 *   - Overdue loan count  — a loan is overdue only when its calendar due-date
 *     is strictly before today; a loan due today is NOT overdue.
 *   - Category breakdown (titles per category)
 *   - 8 most-recent transactions with book title, borrower name, dates, status
 *
 * All Prisma queries run in a single read-only $transaction for consistency.
 */
export async function GET() {
  try {
    // Build today's UTC-midnight boundary so the overdue comparison is
    // calendar-date-based regardless of server timezone.
    // e.g. if today is 2026-09-03 local:  todayUTC = 2026-09-03T00:00:00.000Z
    // A dueDate of 2026-09-03T00:00:00.000Z is NOT before todayUTC  => on time.
    // A dueDate of 2026-09-02T00:00:00.000Z IS before todayUTC      => overdue.
    const todayISO = new Date().toISOString().slice(0, 10);
    const todayUTCMidnight = new Date(todayISO + 'T00:00:00.000Z');

    const [
      bookAggregate,
      borrowerCount,
      activeLoansCount,
      overdueCount,
      categoryBreakdown,
      recentTransactions,
      recentBooks,
    ] = await prisma.$transaction([
      // 1. Aggregate book copies across all titles
      prisma.book.aggregate({
        _count: { id: true },
        _sum: {
          totalCopies: true,
          availableCopies: true,
        },
      }),

      // 2. Total registered borrowers
      prisma.borrower.count(),

      // 3. Active ISSUED loans (copies currently out)
      prisma.transaction.count({
        where: { status: 'ISSUED' },
      }),

      // 4. Overdue active loans: due date strictly before today (calendar)
      prisma.transaction.count({
        where: {
          status: 'ISSUED',
          dueDate: { lt: todayUTCMidnight },
        },
      }),

      // 5. Titles per category, most-populated first.
      // Using _count: { id: true } counts distinct book rows per category.
      // The return type is cast below because Prisma's groupBy types _count
      // as a union (true | {...}) when the query is inside $transaction[].
      prisma.book.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // 6. 8 most-recent transactions with related book and borrower data
      prisma.transaction.findMany({
        take: 8,
        orderBy: { issuedAt: 'desc' },
        select: {
          id: true,
          status: true,
          issuedAt: true,
          dueDate: true,
          returnedAt: true,
          book: {
            select: { title: true, author: true },
          },
          borrower: {
            select: { fullName: true, membershipNumber: true },
          },
        },
      }),

      // 7. 4 most-recently added book titles
      prisma.book.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          totalCopies: true,
          availableCopies: true,
          createdAt: true,
          qrCode: true,
        },
      }),
    ]);

    const titleCount         = bookAggregate._count.id;
    const totalCopiesSum     = bookAggregate._sum.totalCopies     ?? 0;
    const availableCopiesSum = bookAggregate._sum.availableCopies ?? 0;
    const onLoanCount        = totalCopiesSum - availableCopiesSum;

    return NextResponse.json({
      // Book inventory
      titleCount,
      totalCopiesSum,
      availableCopiesSum,
      onLoanCount,

      // People
      borrowerCount,

      // Circulation
      activeLoansCount,
      overdueCount,

      // Category breakdown: [{ category: string, titleCount: number }]
      // _count is typed as `true | { id?: number }` by Prisma inside $transaction[].
      // At runtime it is always the object form; the cast makes TypeScript accept it.
      categoryBreakdown: categoryBreakdown.map((row) => ({
        category:   row.category,
        titleCount: (row._count as { id: number }).id,
      })),

      // Recent activity feed, newest first
      recentTransactions: recentTransactions.map((tx) => ({
        id:               tx.id,
        status:           tx.status,
        issuedAt:         tx.issuedAt,
        dueDate:          tx.dueDate,
        returnedAt:       tx.returnedAt,
        bookTitle:        tx.book.title,
        bookAuthor:       tx.book.author,
        borrowerName:     tx.borrower.fullName,
        membershipNumber: tx.borrower.membershipNumber,
      })),

      // 4 most recently cataloged books
      recentBooks: recentBooks.map((b) => ({
        id:              b.id,
        title:           b.title,
        author:          b.author,
        category:        b.category,
        totalCopies:     b.totalCopies,
        availableCopies: b.availableCopies,
        createdAt:       b.createdAt,
        qrCode:          b.qrCode,
      })),
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data from database.' },
      { status: 500 }
    );
  }
}
