import { NextRequest } from 'next/server';
import { RawMaterialService } from '../../../../services/raw-material.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Raw Materials', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const material = await RawMaterialService.getById(id);
      if (!material) return errorResponse('Raw Material not found', 404);
      return successResponse(material);
    }

    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { materials, total } = await RawMaterialService.getAll({
      search,
      categoryId,
      supplierId,
      warehouseId,
      page,
      limit,
    });
    return paginatedResponse(materials, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
