import { prisma } from '../lib/prisma';

/**
 * Generates the next sequential unique business code for a given model, prefix, and column.
 * Handles alphanumeric padded sequential values (e.g., WH-0001, BIN-1234).
 * Query searches ALL records (ignoring soft-delete status) to ensure code is never reused.
 */
export async function generateNextCode(
  modelName: string,
  prefix: string,
  columnName: string,
  padLength: number = 4,
  tx?: any,
  attempt: number = 0
): Promise<string> {
  const db = tx || prisma;
  
  // Ensure the model exists in the prisma client
  const model = db[modelName] || db[modelName.charAt(0).toUpperCase() + modelName.slice(1)];
  if (!model) {
    throw new Error(`Model ${modelName} not found in Prisma client.`);
  }

  // Find all records starting with prefix to accurately calculate the highest number
  const records = await model.findMany({
    where: {
      [columnName]: {
        startsWith: prefix,
      },
    },
    select: {
      [columnName]: true,
    },
  });

  let maxNum = 0;
  for (const r of records) {
    const val = r[columnName];
    if (typeof val === 'string') {
      const match = val.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1 + attempt;
  let candidateCode = `${prefix}${String(nextNum).padStart(padLength, '0')}`;

  // Double check candidate does not already exist in the database (e.g. from race condition or custom format)
  while (await model.findFirst({ where: { [columnName]: candidateCode }, select: { id: true } })) {
    nextNum++;
    candidateCode = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
  }

  console.log(`[CodeGenerator] Generated verified unique code for ${modelName}: ${candidateCode}`);
  return candidateCode;
}

/**
 * Runs a database creation operation with automatic retries if a unique constraint violation occurs
 * due to concurrent transactions trying to insert the same sequential code.
 */
export async function createWithUniqueCode(
  modelName: string,
  prefix: string,
  columnName: string,
  insertFn: (code: string) => Promise<any>,
  padLength: number = 4
): Promise<any> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      const code = await generateNextCode(modelName, prefix, columnName, padLength, undefined, attempts);
      return await insertFn(code);
    } catch (err: any) {
      // P2002 is Prisma's error code for Unique Constraint Violation
      const isUniqueConstraintError = 
        err.code === 'P2002' || 
        (err.message && err.message.includes('Unique constraint failed')) ||
        (err.message && err.message.includes('unique constraint'));
        
      if (isUniqueConstraintError && attempts < maxAttempts - 1) {
        attempts++;
        console.warn(`[CodeGenerator] Unique code collision on ${modelName} for prefix ${prefix}. Retrying (Attempt ${attempts}/${maxAttempts})...`);
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 50 + Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      console.error(`[CodeGenerator] Failed to create record after ${attempts + 1} attempts due to: ${err.message}`);
      throw err;
    }
  }
}
