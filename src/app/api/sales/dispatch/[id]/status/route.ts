import { NextRequest } from 'next/server';
import { DispatchService } from '../../../../../../services/dispatch.service';
import { updateDispatchStatusSchema } from '../../../../../../validations/dispatch.schema';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = updateDispatchStatusSchema.parse(body);

    const updated = await DispatchService.updateStatus(id, {
      ...validatedData,
      user: validatedData.user || user?.name || 'Dispatch Supervisor',
    });

    return successResponse(updated, `Status updated to ${validatedData.status}`);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
