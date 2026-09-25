import { NextRequest } from 'next/server';
import { PurchaseOrderService } from '../../../../../services/purchase-order.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Purchase Orders', 403);
    }

    const params = await Promise.resolve(context.params);
    const id = params.id;

    const po = await PurchaseOrderService.getById(id);
    if (!po) return errorResponse('Purchase Order not found', 404);

    const attachments = await PurchaseOrderService.getAttachments(id);
    return successResponse(attachments);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch attachments', 400);
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:edit') && !hasApiPermission(user, 'procurement_po:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Upload PO Documents', 403);
    }

    const params = await Promise.resolve(context.params);
    const id = params.id;

    const po = await PurchaseOrderService.getById(id);
    if (!po) return errorResponse('Purchase Order not found', 404);

    // Verify PO is in an approved/completed stage
    const validStages = ['Approved', 'Completed', 'Confirmed', 'Partially Received'];
    if (!validStages.includes(po.status)) {
      return errorResponse(`Cannot upload documents for PO in status "${po.status}". PO must be Approved, Completed, Confirmed, or Partially Received.`, 400);
    }

    const body = await req.json();
    const { fileName, fileType, fileSize, fileData } = body;

    if (!fileName || !fileData) {
      return errorResponse('File name and file data are required', 400);
    }

    // Validate file size (max 10MB = 10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize && fileSize > MAX_SIZE) {
      return errorResponse('File size exceeds maximum allowed limit of 10MB', 400);
    }

    const attachment = await PurchaseOrderService.addAttachment(id, {
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 0,
      fileData,
      uploadedBy: user?.name || 'Administrator'
    });

    return successResponse(attachment, 'Document uploaded successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to upload document', 400);
  }
}
