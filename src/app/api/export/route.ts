import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class: true,
        records: {
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate CSV
    const rows = [
      ['S/N', 'Matric / Reg No.', 'Full Name', 'Course Code', 'Course Title', 'Time Recorded', 'Device Mode'],
      ...session.records.map((r, i) => [
        (i + 1).toString(),
        `"${r.studentId}"`,
        `"${r.studentName}"`,
        `"${session.class.courseCode}"`,
        `"${session.class.courseTitle}"`,
        `"${new Date(r.submittedAt).toLocaleTimeString()}"`,
        `"${r.deviceFingerprint === 'shared-friend-device' ? 'Friend Mode' : 'Personal Phone'}"`,
      ]),
    ];

    const csvContent = rows.map((e) => e.join(',')).join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Attendance_${session.class.courseCode}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
