import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const bom = await ProductionService.getBomById(id);
      if (!bom) return errorResponse('BOM not found', 404);
      return successResponse(bom);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { boms, total } = await ProductionService.getBoms({
      search,
      status,
      productId,
      page,
      limit,
    });

    return paginatedResponse(boms, total, page, limit);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch BOMs', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:create') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.name || !body.productId) {
      return errorResponse('BOM name and product are required', 400);
    }

    const bom = await ProductionService.createBom(body);
    return successResponse(bom, 'BOM created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create BOM', 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:edit') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return errorResponse('BOM ID is required', 400);

    const bom = await ProductionService.updateBom(id, data);
    return successResponse(bom, 'BOM updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update BOM', 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return errorResponse('BOM ID is required', 400);

    await ProductionService.deleteBom(id, user?.name);
    return successResponse(null, 'BOM deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete BOM', 400);
  }
}
