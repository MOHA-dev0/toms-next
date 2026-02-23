import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppRole, Employee, QuotationStatus } from '@prisma/client';

export interface UserContext {
  userId: string;
  role: AppRole;
  employeeId?: string;
  employee?: Employee;
  isAdmin: boolean;
  isSales: boolean;
  isBooking: boolean;
}

export async function getUserContext(): Promise<UserContext | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: true,
      employee: true,
    },
  });

  if (!user) return null;

  const role = user.userRoles[0]?.role;
  if (!role) return null;

  return {
    userId: user.id,
    role: role,
    employeeId: user.employee?.id,
    employee: user.employee || undefined,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    isBooking: role === 'booking',
  };
}



export function getAccessFilters(context: UserContext, entityType: 'quotation' | 'booking' | 'customer') {
  if (context.isAdmin) return {}; // No filters for admin
  
  if (context.isSales) {
    if (!context.employeeId) throw new Error('Sales user must have an employee profile');
    
    switch (entityType) {
      case 'quotation':
        return { salesEmployeeId: context.employeeId };
      case 'booking':
        // Sales can only see bookings derived from their quotations
        return { quotation: { salesEmployeeId: context.employeeId } };
      case 'customer':
        return { createdBy: context.employeeId };
      default:
        return { id: 'impossible-id' }; // Block access
    }
  }

  if (context.isBooking) {
    if (!context.employeeId) throw new Error('Booking user must have an employee profile');
    
    switch (entityType) {
      case 'quotation':
        // For booking: See ALL confirmed ones (to process them) 
        // OR see my own ones (any status)
        return {
          OR: [
            { status: QuotationStatus.confirmed },
            { salesEmployeeId: context.employeeId }
          ]
        };
      case 'booking':
        return {}; // Booking staff usually see all active bookings
      case 'customer':
        return {}; // Booking staff usually see all customers
      default:
        return {};
    }
  }

  return { id: 'impossible-id' }; // Default deny
}
