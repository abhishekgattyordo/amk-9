import { NextRequest } from 'next/server';
import { DispatchService } from '../../../../../../services/dispatch.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    let reason = 'Cancelled by user';
    try {
      const body = await req.json();
      if (body?.reason) reason = body.reason;
    } catch (_) {}

    const cancelled = await DispatchService.cancelDispatch(id, {
      reason,
      user: user?.name || 'Dispatch Supervisor',
    });

    return successResponse(cancelled, 'Delivery Challan cancelled and inventory restocked successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
