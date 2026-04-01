import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { isDone, title, startTime, companyId } = body

    console.log("PATCH INCOMING", { id, title, startTime, companyId, isDone })

    const task = await prisma.task.update({
      where: { id: id },
      data: {
        isDone: isDone !== undefined ? isDone : undefined,
        title: title !== undefined ? title : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        companyId: companyId !== undefined ? companyId : undefined
      },
      include: { company: true }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("API PATCH Error:", error)
    return NextResponse.json({ error: 'Update Failed: ' + String(error) }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete Failed' }, { status: 500 })
  }
}
