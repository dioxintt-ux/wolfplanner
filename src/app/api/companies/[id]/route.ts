import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// Update Company (Name/Color)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, color } = body

    const updated = await prisma.company.update({
      where: { id: id },
      data: {
        name: name || undefined,
        color: color || undefined
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

// Delete Company (This will also delete tasks due to Cascade)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.company.delete({
      where: { id: id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
