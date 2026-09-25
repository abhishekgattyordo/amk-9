import { NextRequest } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser } from '../../../../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthorizedUser(req);
    if (!authUser) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || user.isDeleted) return errorResponse('User not found', 404);

    const { password: _, ...userNoPass } = user;
    return successResponse(userNoPass);
  } catch (err: any) {
    return errorResponse(err.message || err, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthorizedUser(req);
    const roleName = authUser?.role?.name || (typeof authUser?.role === 'string' ? authUser?.role : '') || authUser?.roleName || '';
    const isAdmin = roleName === 'Administrator' || roleName === 'Super Admin' || authUser?.email === 'rajesh.sharma@amkerp.com' || authUser?.email === 'admin@amkerp.com';
    if (!authUser || !isAdmin) {
      return errorResponse('Forbidden: Only Administrators can manage users', 403);
    }

    const { id } = await params;
    const body = await req.json();
    const prisma = getPrisma();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.roleId !== undefined) updateData.roleId = body.roleId;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    const { password: _, ...userNoPass } = updated;
    return successResponse(userNoPass, 'User updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthorizedUser(req);
    const roleName = authUser?.role?.name || (typeof authUser?.role === 'string' ? authUser?.role : '') || authUser?.roleName || '';
    const isAdmin = roleName === 'Administrator' || roleName === 'Super Admin' || authUser?.email === 'rajesh.sharma@amkerp.com' || authUser?.email === 'admin@amkerp.com';
    if (!authUser || !isAdmin) {
      return errorResponse('Forbidden: Only Administrators can delete users', 403);
    }

    const { id } = await params;
    const prisma = getPrisma();

    // Soft delete user and move to recycle bin
    const deleted = await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: authUser?.name || authUser?.email || 'Administrator',
      },
    });

    return successResponse({ id: deleted.id }, 'User soft-deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err.message || err, 500);
  }
}
