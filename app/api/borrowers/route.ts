import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const borrowers = await prisma.borrower.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        membershipNumber: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: {
              where: {
                status: 'ISSUED',
              },
            },
          },
        },
      },
    });

    return NextResponse.json(borrowers);
  } catch (error: any) {
    console.error('Error fetching borrowers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrowers from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, membershipNumber } = body;

    // Validate required fields
    if (!fullName || !fullName.trim() || !email || !email.trim() || !membershipNumber || !membershipNumber.trim()) {
      return NextResponse.json(
        { error: 'Full name, email, and membership number are required fields.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const trimmedFullName = fullName.trim();
    const trimmedMembership = membershipNumber.trim();
    const trimmedPhone = phone && phone.trim() ? phone.trim() : null;

    const newBorrower = await prisma.borrower.create({
      data: {
        fullName: trimmedFullName,
        email: trimmedEmail,
        phone: trimmedPhone,
        membershipNumber: trimmedMembership,
      },
    });

    return NextResponse.json(newBorrower, { status: 201 });
  } catch (error: any) {
    console.error('Error creating borrower:', error);

    // Handle Prisma unique constraint violation (code P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        if (target.includes('email')) {
          return NextResponse.json(
            { error: 'A borrower with this email already exists in the registry.' },
            { status: 409 }
          );
        }
        if (target.includes('membershipNumber')) {
          return NextResponse.json(
            { error: 'A borrower with this membership number already exists in the registry.' },
            { status: 409 }
          );
        }
      }
      return NextResponse.json(
        { error: 'A borrower with this email or membership number already exists in the registry.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred while registering the borrower.' },
      { status: 500 }
    );
  }
}
