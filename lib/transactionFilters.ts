import { Prisma } from '@prisma/client';

/**
 * Builds a Prisma TransactionWhereInput from URL search parameters.
 * Shared between /api/transactions and /api/transactions/export to guarantee
 * consistent filtering across UI display and CSV export.
 */
export function buildTransactionWhereInput(searchParams: URLSearchParams): {
  where: Prisma.TransactionWhereInput;
  todayUTCMidnight: Date;
  todayISO: string;
} {
  const statusParam = searchParams.get('status')?.trim().toUpperCase();
  const overdueParam = searchParams.get('overdue')?.trim().toUpperCase();
  const fromParam = (searchParams.get('from') || searchParams.get('fromDate') || searchParams.get('startDate'))?.trim();
  const toParam = (searchParams.get('to') || searchParams.get('toDate') || searchParams.get('endDate'))?.trim();
  const bookParam = (searchParams.get('book') || searchParams.get('bookId'))?.trim();
  const borrowerParam = (searchParams.get('borrower') || searchParams.get('borrowerId'))?.trim();

  // Date-only UTC midnight boundary for overdue comparison
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayUTCMidnight = new Date(todayISO + 'T00:00:00.000Z');

  const andConditions: Prisma.TransactionWhereInput[] = [];

  // 1. Status filter
  if (statusParam === 'ISSUED') {
    andConditions.push({ status: 'ISSUED' });
  } else if (statusParam === 'RETURNED') {
    andConditions.push({ status: 'RETURNED' });
  }

  // 2. Overdue filter
  // Overdue means ONLY an active ISSUED transaction whose calendar due date
  // is strictly before today. A loan due today is On Time.
  if (overdueParam === 'OVERDUE') {
    andConditions.push({
      status: 'ISSUED',
      dueDate: { lt: todayUTCMidnight },
    });
  } else if (overdueParam === 'ON_TIME' || overdueParam === 'ONTIME') {
    if (statusParam === 'ISSUED') {
      andConditions.push({
        dueDate: { gte: todayUTCMidnight },
      });
    } else if (statusParam === 'RETURNED') {
      // Returned loans are never overdue
    } else {
      // Either RETURNED, or active ISSUED with dueDate >= todayUTCMidnight
      andConditions.push({
        OR: [
          { status: 'RETURNED' },
          {
            status: 'ISSUED',
            dueDate: { gte: todayUTCMidnight },
          },
        ],
      });
    }
  }

  // 3. Date range filter for issuedAt
  if (fromParam) {
    const fromDate = new Date(`${fromParam}T00:00:00.000Z`);
    if (!isNaN(fromDate.getTime())) {
      andConditions.push({ issuedAt: { gte: fromDate } });
    }
  }
  if (toParam) {
    const toDate = new Date(`${toParam}T23:59:59.999Z`);
    if (!isNaN(toDate.getTime())) {
      andConditions.push({ issuedAt: { lte: toDate } });
    }
  }

  // 4. Book filter
  if (bookParam && bookParam !== 'ALL') {
    andConditions.push({
      OR: [
        { bookId: bookParam },
        { book: { title: { contains: bookParam, mode: 'insensitive' } } },
        { book: { isbn: { contains: bookParam, mode: 'insensitive' } } },
      ],
    });
  }

  // 5. Borrower filter
  if (borrowerParam && borrowerParam !== 'ALL') {
    andConditions.push({
      OR: [
        { borrowerId: borrowerParam },
        { borrower: { fullName: { contains: borrowerParam, mode: 'insensitive' } } },
        { borrower: { membershipNumber: { contains: borrowerParam, mode: 'insensitive' } } },
        { borrower: { email: { contains: borrowerParam, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.TransactionWhereInput = andConditions.length > 0
    ? { AND: andConditions }
    : {};

  return { where, todayUTCMidnight, todayISO };
}
