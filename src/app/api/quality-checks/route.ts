import { NextRequest } from 'next/server';
import { QualityCheckService } from '../../../services/quality-check.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

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

    const { searchParams } = req.nextUrl;
    const mode = searchParams.get('mode');

    // Stats mode for dashboard
    if (mode === 'stats') {
      const stats = await QualityCheckService.getDashboardStats();
      return successResponse(stats);
    }

    // Pending candidates queue
    if (mode === 'pending-queue' || mode === 'candidates') {
      const candidates = await QualityCheckService.getPendingCandidates();
      return successResponse(candidates);
    }

    const id = searchParams.get('id');
    if (id) {
      const check = await QualityCheckService.getById(id);
      if (!check) return errorResponse('Quality check record not found', 404);
      return successResponse(check);
    }

    const qcType = searchParams.get('qcType') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const status = searchParams.get('status') || undefined;
    const result = searchParams.get('result') || undefined;
    const search = searchParams.get('search') || undefined;
    const salesOrderId = searchParams.get('salesOrderId') || undefined;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const reelInwardId = searchParams.get('reelInwardId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const rawMaterialId = searchParams.get('rawMaterialId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { checks, total } = await QualityCheckService.getAll({
      qcType,
      referenceType,
      status,
      result,
      search,
      salesOrderId,
      workOrderId,
      reelInwardId,
      productId,
      rawMaterialId,
      page,
      limit,
    });
    return paginatedResponse(checks, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const hasCreatePerm = 
      hasApiPermission(user, 'qc:create') || 
      hasApiPermission(user, 'procurement_qc:create') || 
      hasApiPermission(user, 'production_qc:create') ||
      hasApiPermission(user, 'qc:view');

    if (!hasCreatePerm) {
      return errorResponse('Forbidden: Insufficient Permissions to Record Quality Control Checks', 403);
    }

    const body = await req.json();
    if (!body.inspector && user?.name) {
      body.inspector = user.name;
    }
    const check = await QualityCheckService.create(body);
    return successResponse(check, 'Quality check recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const hasEditPerm = 
      hasApiPermission(user, 'qc:edit') || 
      hasApiPermission(user, 'procurement_qc:edit') || 
      hasApiPermission(user, 'production_qc:edit') ||
      hasApiPermission(user, 'qc:view');

    if (!hasEditPerm) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Quality Control Checks', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Quality Check ID required', 400);

    const body = await req.json();
    const check = await QualityCheckService.update(id, body);
    return successResponse(check, 'Quality Check updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const hasDeletePerm = 
      hasApiPermission(user, 'qc:delete') || 
      hasApiPermission(user, 'procurement_qc:delete') || 
      hasApiPermission(user, 'production_qc:delete') ||
      hasApiPermission(user, 'all:write');

    if (!hasDeletePerm) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Quality Control Checks', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Quality Check ID required', 400);

    const check = await QualityCheckService.softDelete(id, user?.name || 'User');
    return successResponse(check, 'Quality Check record moved to recycle bin');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
