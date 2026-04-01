import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// Get All Companies or Create One
export async function POST(req: Request) {
  try {
    const { name, color } = await req.json()
    const company = await prisma.company.create({
      data: { name, color: color || '#00f2ff' }
    })
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
