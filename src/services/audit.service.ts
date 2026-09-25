import { prisma } from '../lib/prisma';

export class AuditService {
  static async getValidUserId(userId?: string | null, client?: any): Promise<string | undefined> {
    if (!userId || typeof userId !== 'string') return undefined;
    try {
      const db = client || prisma;
      const userExists = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      return userExists ? userExists.id : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Safely create an audit log entry in Prisma or within a transaction ($tx).
   * Validates foreign key constraints to prevent transaction rollbacks.
   */
  static async safeCreate(
    clientOrTx: any,
    data: {
      action: string;
      module?: string | null;
      entity: string;
      entityId: string;
      fieldName?: string | null;
      oldValue?: string | null;
      newValue?: string | null;
      user?: string | null;
      userId?: string | null;
      details?: string | null;
      timestamp?: Date;
    }
  ) {
    const db = clientOrTx || prisma;
    try {
      let validUserId = undefined;
      if (data.userId) {
        validUserId = await this.getValidUserId(data.userId, db);
      }

      return await db.auditLog.create({
        data: {
          action: data.action,
          module: data.module || null,
          entity: data.entity,
          entityId: data.entityId,
          fieldName: data.fieldName || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
          user: data.user || null,
          userId: validUserId,
          details: data.details || null,
          timestamp: data.timestamp || new Date(),
        },
      });
    } catch (err) {
      console.warn('[AuditService] Failed to create audit log with userId, retrying without userId:', err);
      try {
        return await db.auditLog.create({
          data: {
            action: data.action,
            module: data.module || null,
            entity: data.entity,
            entityId: data.entityId,
            fieldName: data.fieldName || null,
            oldValue: data.oldValue || null,
            newValue: data.newValue || null,
            user: data.user || null,
            userId: undefined,
            details: data.details || null,
            timestamp: data.timestamp || new Date(),
          },
        });
      } catch (innerErr) {
        console.warn('[AuditService] Audit log creation failed completely, continuing transaction:', innerErr);
        return null;
      }
    }
  }

  /**
   * Compares two objects and creates audit log entries for changed fields.
   * @param entity 'Product' | 'RawMaterial'
   * @param entityId The ID of the record
   * @param oldData The original record data
   * @param newData The updated record data
   * @param userId The ID of the user performing the update
   * @param userName The name of the user performing the update
   */
  static async logChanges(
    entity: 'Product' | 'RawMaterial',
    entityId: string,
    oldData: any,
    newData: any,
    userId: string | undefined,
    userName: string | undefined
  ) {
    const validUserId = await this.getValidUserId(userId);
    const fieldsToIgnore = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'warehouse'];
    const fieldNames: string[] = [];
    const oldValues: string[] = [];
    const newValues: string[] = [];

    // Filter out complex objects and only compare primitive values
    for (const key in newData) {
      if (fieldsToIgnore.includes(key)) continue;

      const oldValue = oldData[key];
      const newValue = newData[key];

      // Deep comparison for simple types (strings, numbers, booleans)
      if (oldValue !== newValue && (typeof newValue !== 'object' || newValue === null)) {
        fieldNames.push(key);
        oldValues.push(`${key}: ${oldValue?.toString() || 'N/A'}`);
        newValues.push(`${key}: ${newValue?.toString() || 'N/A'}`);
      }
    }

    if (fieldNames.length > 0) {
      await this.safeCreate(prisma, {
        action: 'Update',
        entity,
        entityId,
        fieldName: fieldNames.join(', '),
        oldValue: oldValues.join('; '),
        newValue: newValues.join('; '),
        userId: validUserId,
        user: userName,
        timestamp: new Date(),
      });
    }
  }

  static async logCreate(
    entity: 'Product' | 'RawMaterial',
    entityId: string,
    data: any,
    userId: string | undefined,
    userName: string | undefined
  ) {
    const validUserId = await this.getValidUserId(userId);
    await this.safeCreate(prisma, {
      action: 'Create',
      entity,
      entityId,
      details: 'Record created',
      userId: validUserId,
      user: userName,
      timestamp: new Date(),
    });
  }

  static async logAction(
    action: string,
    entity: string,
    entityId: string,
    details: string,
    userId: string | undefined,
    userName: string | undefined
  ) {
    const validUserId = await this.getValidUserId(userId);
    await this.safeCreate(prisma, {
      action,
      entity,
      entityId,
      details,
      userId: validUserId,
      user: userName,
      timestamp: new Date(),
    });
  }

  static async getHistory(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
