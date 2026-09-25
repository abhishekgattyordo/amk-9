import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:approve') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'admin:write')) {
      return errorResponse('Forbidden: Insufficient Permissions to Approve Daily Production Reports', 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updated = await ProductionService.approveDailyReport(
      id,
      user?.name || 'Production Manager',
      body?.remarks || 'Approved by Production Manager'
    );

    return successResponse(updated, 'Daily Production Report approved successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to approve daily report', 400);
  }
}
