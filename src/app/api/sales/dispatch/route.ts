import { NextRequest } from 'next/server';
import { DispatchService } from '../../../../services/dispatch.service';
import { createDispatchSchema } from '../../../../validations/dispatch.schema';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Dispatches', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const dispatch = await DispatchService.getById(id);
      if (!dispatch) return errorResponse('Delivery Challan not found', 404);
      return successResponse(dispatch);
    }

    const salesOrderId = searchParams.get('salesOrderId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { dispatches, total } = await DispatchService.getAll({
      salesOrderId,
      customerId,
      status,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return paginatedResponse(dispatches, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Dispatches', 403);
    }

    const body = await req.json();
    const validatedData = createDispatchSchema.parse(body);

    const dispatch = await DispatchService.create({
      ...validatedData,
      dispatchedBy: validatedData.dispatchedBy || user?.name || 'Dispatch Supervisor',
    });

    return successResponse(dispatch, 'Delivery Challan created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
