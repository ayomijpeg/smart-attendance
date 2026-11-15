import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { classId, durationMinutes = 10 } = await req.json();

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Close any currently active sessions for this class
    await prisma.attendanceSession.updateMany({
      where: { classId, status: 'active' },
      data: { status: 'closed' },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session = await prisma.attendanceSession.create({
      data: {
        classId,
        status: 'active',
        durationMinutes,
        openedAt: now,
        expiresAt,
      },
      include: {
        class: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { sessionId, status } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: status || 'closed' },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
