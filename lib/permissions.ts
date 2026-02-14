import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppRole, Employee } from '@prisma/client';

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
        // Sales can only see bookings derived from their quotations OR assigned to them explicitly?
        // Requirement: "Sales User must only see and access their own bookings"
        // Usually booking implies "created by or managed by". 
        // In this schema, booking has `bookingEmployeeId` (who manages the booking) and `quotation.salesEmployeeId` (who sold it).
        // If the requirement means "Bookings I made", it usually refers to the sales side.
        // If it means "Bookings I am processing", it refers to booking staff.
        // Re-reading: "bookings created by other sales users" implies sales users create bookings?
        // Or sales users create quotations which become bookings.
        // Safest: Filter by the Quotation's Sales Employee.
        return { quotation: { salesEmployeeId: context.employeeId } };
      case 'customer':
        return { createdBy: context.employeeId };
      default:
        return { id: 'impossible-id' }; // Block access
    }
  }

  if (context.isBooking) {
    if (!context.employeeId) throw new Error('Booking user must have an employee profile');
    // Booking users might need to see everything or just what's assigned.
    // Assuming Booking users handle all bookings for now, unless specified otherwise.
    // If strict isolation is needed for Booking users too:
    // return { bookingEmployeeId: context.employeeId };
    return {}; // Booking staff usually see all active bookings
  }

  return { id: 'impossible-id' }; // Default deny
}
