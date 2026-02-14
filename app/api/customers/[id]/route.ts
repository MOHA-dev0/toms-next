import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/services/customer.service'

function transformCustomer(customer: any) {
  return {
    id: customer.id,
    name_ar: customer.nameAr,
    email: customer.email,
    phone: customer.phone,
    nationality: customer.nationality,
    passport_number: customer.passportNumber,
    notes: customer.notes,
    created_at: customer.createdAt,
  }
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const customer = await customerService.update(id, body)
    return NextResponse.json(transformCustomer(customer))
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Error updating customer' }, { status: 500 })
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await customerService.delete(id)
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Error deleting customer' }, { status: 500 })
  }
}
