import { NextRequest } from 'next/server';
import { QualityCheckService } from '../../../../services/quality-check.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const hasViewPerm = 
      hasApiPermission(user, 'qc:view') || 
      hasApiPermission(user, 'procurement_qc:view') || 
      hasApiPermission(user, 'production_qc:view');

    if (!hasViewPerm) {
      return errorResponse('Forbidden: Insufficient Permissions to View Quality Control Checks', 403);
    }

    const stats = await QualityCheckService.getDashboardStats();
    return successResponse(stats);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
