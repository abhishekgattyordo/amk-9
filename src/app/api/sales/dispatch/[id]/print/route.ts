import { NextRequest } from 'next/server';
import { DispatchService } from '../../../../../../services/dispatch.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const printData = await DispatchService.getPrintData(id);

    return successResponse(printData);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
