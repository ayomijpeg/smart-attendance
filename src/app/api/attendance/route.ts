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

    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            registeredAt: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, studentId, studentName, selfieData, deviceFingerprint, profilePhoto } = body;

    if (!sessionId || !studentId || !studentName || !selfieData) {
      return NextResponse.json(
        { error: 'Session ID, Student ID, Name, and In-Class Selfie are required' },
        { status: 400 }
      );
    }

    const cleanId = studentId.trim().toUpperCase();

    // 1. Check or create Student profile
    let student = await prisma.student.findUnique({
      where: { id: cleanId },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          id: cleanId,
          name: studentName.trim(),
          profilePhoto: profilePhoto || selfieData,
        },
      });
    }

    // 2. Check if session exists and is currently active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Class attendance session not found' }, { status: 404 });
    }

    const now = new Date();
    if (session.status !== 'active' || now > new Date(session.expiresAt)) {
      if (session.status === 'active') {
        await prisma.attendanceSession.update({
          where: { id: sessionId },
          data: { status: 'closed' },
        });
      }
      return NextResponse.json(
        { error: 'Attendance window has closed for this lecture' },
        { status: 403 }
      );
    }

    // 3. Check for duplicate attendance submission
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        sessionId,
        studentId: cleanId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already marked attendance for this lecture' },
        { status: 409 }
      );
    }

    // 4. Record attendance
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        studentId: cleanId,
        studentName: studentName.trim(),
        selfieData,
        deviceFingerprint: deviceFingerprint || 'student-phone',
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance recorded successfully',
        record: {
          id: record.id,
          studentId: record.studentId,
          studentName: record.studentName,
          submittedAt: record.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
