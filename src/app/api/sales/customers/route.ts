import { NextRequest } from 'next/server';
import { SalesService } from '../../../../services/sales.service';
import { createCustomerSchema } from '../../../../validations/sales.schema';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const customer = await SalesService.getCustomerById(id);
      if (!customer) return errorResponse('Customer not found', 404);
      return successResponse(customer);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { customers, total } = await SalesService.getCustomers({
      search,
      status,
      page,
      limit,
    });

    return paginatedResponse(customers, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:create')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const validatedData = createCustomerSchema.parse(body);

    const customer = await SalesService.createCustomer({
      ...validatedData,
      salesExecutive: validatedData.salesExecutive || user?.name || 'Sales Executive',
    });

    return successResponse(customer, 'Customer created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
