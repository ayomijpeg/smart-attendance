import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const student = await prisma.student.findUnique({
        where: { id: id.trim().toUpperCase() },
      });
      return NextResponse.json(student);
    }

    const students = await prisma.student.findMany({
      orderBy: { registeredAt: 'desc' },
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, profilePhoto } = body;

    if (!id || !name || !profilePhoto) {
      return NextResponse.json(
        { error: 'Student ID, Full Name, and Profile Photo are required' },
        { status: 400 }
      );
    }

    const cleanId = id.trim().toUpperCase();

    // Check if already exists
    const existing = await prisma.student.findUnique({
      where: { id: cleanId },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const newStudent = await prisma.student.create({
      data: {
        id: cleanId,
        name: name.trim(),
        profilePhoto,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
