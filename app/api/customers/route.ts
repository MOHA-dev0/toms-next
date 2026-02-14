import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/services/customer.service'

// Helper to transform DB customer to snake_case for frontend
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

// GET /api/customers
export async function GET() {
  try {
    const customers = await customerService.getAll()
    const transformedCustomers = customers.map(transformCustomer)
    return NextResponse.json(transformedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 })
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await customerService.create(body)
    return NextResponse.json(transformCustomer(customer))
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 })
  }
}
