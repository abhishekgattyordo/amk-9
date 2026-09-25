import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read') && !hasApiPermission(user, 'admin:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse('Report ID is required', 400);
    }

    const report = await ProductionService.getDailyProductionReportById(id);
    if (!report) {
      return errorResponse('Daily Production Report not found', 404);
    }

    return successResponse(report);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch daily production report', 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (
      !hasApiPermission(user, 'production:write') &&
      !hasApiPermission(user, 'production:approve') &&
      !hasApiPermission(user, 'production:view') &&
      !hasApiPermission(user, 'admin:write')
    ) {
      return errorResponse('Forbidden: Insufficient Permissions to Update Daily Production Report', 403);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse('Report ID is required', 400);
    }

    // Verify the report exists before updating
    const existing = await ProductionService.getDailyProductionReportById(id);
    if (!existing) {
      return errorResponse('Daily Production Report not found', 404);
    }

    const body = await req.json().catch(() => ({}));

    const updated = await ProductionService.updateDailyProductionReport(id, {
      ...body,
      ...(body.approvedBy ? { approvedBy: body.approvedBy } : body.status === 'Approved' ? { approvedBy: user?.name || 'Production Manager' } : {}),
    });

    return successResponse(updated, 'Daily Production Report updated successfully');
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('not found')) {
      return errorResponse(err.message, 404);
    }
    return errorResponse(err.message || 'Failed to update daily production report', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'admin:write')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Daily Production Report', 403);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse('Report ID is required', 400);
    }

    // Verify exists
    const existing = await ProductionService.getDailyProductionReportById(id);
    if (!existing) {
      return errorResponse('Daily Production Report not found', 404);
    }

    await ProductionService.deleteDailyProductionReport(id, user?.name || user?.email || 'User');

    return successResponse({ id, deleted: true }, 'Daily Production Report deleted successfully');
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('not found')) {
      return errorResponse(err.message, 404);
    }
    return errorResponse(err.message || 'Failed to delete daily production report', 400);
  }
}
