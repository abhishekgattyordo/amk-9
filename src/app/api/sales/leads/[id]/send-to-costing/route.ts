import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../../services/sales.service';
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
    const body = await req.json().catch(() => ({}));

    const result = await SalesService.sendLeadToCosting(id, {
      ...body,
      user: user?.name || body.user || 'Sales Executive',
    });

    return successResponse(result, 'Lead sent to Costing Department successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
