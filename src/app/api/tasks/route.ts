import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEFAULT_COMPANIES = [
  { name: 'SVOI', color: '#00f2ff' },
  { name: 'Vicekeeper', color: '#7d26ff' },
  { name: 'Linion', color: '#00ff9d' },
  { name: 'Megapolis', color: '#ff8c00' },
]

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Improved Seed Check
    let companies = await prisma.company.findMany()
    if (companies.length === 0) {
      console.log('Seeding companies for the first time...')
      await prisma.company.createMany({ data: DEFAULT_COMPANIES })
      companies = await prisma.company.findMany() // Re-fetch after seeding
    }

    const tasks = await prisma.task.findMany({
      where: { targetDate: dateStr },
      include: { company: true },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json({ tasks, companies })
  } catch (error) {
    console.error('API GET Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, startTime, companyId, targetDate, duration, isBreak } = body

    // Validate: Breaks don't need companyId, standard tasks do.
    if (!title || !startTime || (!isBreak && !companyId)) {
      console.error('POST Missing data:', { title, startTime, companyId, isBreak })
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        startTime,
        isBreak: isBreak || false,
        companyId: isBreak ? null : (companyId || null),
        targetDate: targetDate || new Date().toISOString().split('T')[0],
        duration: duration || 60
      },
      include: {
        company: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('API POST Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
