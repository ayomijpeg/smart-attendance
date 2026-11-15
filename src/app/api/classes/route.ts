import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        sessions: {
          orderBy: { openedAt: 'desc' },
          take: 1,
          include: {
            records: {
              include: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseCode, courseTitle, lecturer } = body;

    if (!courseCode || !courseTitle) {
      return NextResponse.json({ error: 'Course code and title are required' }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        courseCode: courseCode.trim().toUpperCase(),
        courseTitle: courseTitle.trim(),
        lecturer: (lecturer || 'Department Lecturer').trim(),
      },
      include: {
        sessions: {
          orderBy: { openedAt: 'desc' },
          take: 1,
          include: {
            records: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
