import { NextRequest } from 'next/server';
import { DispatchService } from '../../../../../services/dispatch.service';
import { updateDispatchSchema } from '../../../../../validations/dispatch.schema';
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
    const dispatch = await DispatchService.getById(id);
    if (!dispatch) return errorResponse('Delivery Challan not found', 404);

    return successResponse(dispatch);
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
    const validatedData = updateDispatchSchema.parse(body);

    const updated = await DispatchService.update(id, validatedData);
    return successResponse(updated, 'Delivery Challan updated successfully');
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
    await DispatchService.delete(id);

    return successResponse({ id }, 'Delivery Challan cancelled and stock restored successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
