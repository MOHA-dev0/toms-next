import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/services/customer.service'
import { getUserContext, getAccessFilters } from '@/lib/permissions'

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
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = getAccessFilters(userContext, 'customer');
    if (filters.id === 'impossible-id') {
       // Optional: return empty list or 403. Returning empty list is often safer/cleaner UI wise.
       return NextResponse.json([]); 
    }

    const customers = await customerService.getAll(filters)
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
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure Sales/Booking users have an employee profile
    if ((userContext.isSales || userContext.isBooking) && !userContext.employeeId) {
       return NextResponse.json({ error: 'User profile incomplete' }, { status: 403 });
    }

    const body = await request.json()
    
    // Enforce ownership
    if (userContext.isSales) {
        body.created_by = userContext.employeeId;
    }

    const customer = await customerService.create(body)
    return NextResponse.json(transformCustomer(customer))
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 })
  }
}
