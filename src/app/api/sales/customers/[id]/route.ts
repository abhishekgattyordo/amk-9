import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../services/sales.service';
import { updateCustomerSchema } from '../../../../../validations/sales.schema';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const customer = await SalesService.getCustomerById(id);
    if (!customer) return errorResponse('Customer not found', 404);

    return successResponse(customer);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = updateCustomerSchema.parse(body);

    const updated = await SalesService.updateCustomer(id, validatedData);
    return successResponse(updated, 'Customer updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    await SalesService.deleteCustomer(id);

    return successResponse({ id }, 'Customer deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
