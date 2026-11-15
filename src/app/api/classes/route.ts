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
            records: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Collect all student IDs across recent records
    const studentIds = new Set<string>();
    classes.forEach((c) => {
      c.sessions?.forEach((s) => {
        s.records?.forEach((r) => {
          if (r.studentId) studentIds.add(r.studentId);
        });
      });
    });

    let studentMap: Record<string, { id: string; name: string; profilePhoto: string }> = {};
    if (studentIds.size > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: Array.from(studentIds) } },
        select: { id: true, name: true, profilePhoto: true },
      });
      students.forEach((st) => {
        studentMap[st.id] = st;
      });
    }

    const enrichedClasses = classes.map((c) => ({
      ...c,
      sessions: (c.sessions || []).map((s) => ({
        ...s,
        records: (s.records || []).map((r) => ({
          ...r,
          student: studentMap[r.studentId] || null,
        })),
      })),
    }));

    return NextResponse.json(enrichedClasses);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
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
            records: true,
          },
        },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
