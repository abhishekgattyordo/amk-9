import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await ProductionService.releaseOrReturnAllocation(
      id,
      user?.name || 'Store Keeper',
      body?.reason || 'Allocation released and returned to Godown 1'
    );

    return successResponse(result, 'Material allocation released and stock returned to Godown 1 successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to release material allocation', 400);
  }
}
