import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const updatedStep = await ProductionService.updateProcessExecution(id, {
      ...body,
      operatorName: body.operatorName || user?.name,
    });

    return successResponse(updatedStep, 'Process stage updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update process stage', 400);
  }
}
