#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'data-migration-report.json');
const APPLY_MODE = process.argv.includes('--apply');
const STRICT_MODE = process.argv.includes('--strict');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-forge';

const nowIso = () => new Date().toISOString();
const createId = () => new mongoose.Types.ObjectId().toString();

function isDatabaseUnavailable(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /ECONNREFUSED|MongooseServerSelectionError|connect ETIMEDOUT|server selection/i.test(message);
}

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (['developer', 'reseller', 'franchise', 'influencer', 'boss'].includes(value)) return value;
  return null;
}

function normalizeUserStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['PENDING', 'ACTIVE', 'REJECTED'].includes(value)) return value;
  if (value === 'APPROVED') return 'ACTIVE';
  return 'PENDING';
}

function normalizePaymentStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(value)) return value;
  if (['SUCCESS', 'PAID'].includes(value)) return 'COMPLETED';
  if (['ERROR', 'DECLINED'].includes(value)) return 'FAILED';
  return 'PENDING';
}

function normalizeLicenseType(type) {
  const value = String(type || '').trim().toUpperCase();
  if (['TRIAL', 'STANDARD', 'PREMIUM', 'ENTERPRISE'].includes(value)) return value;
  return 'STANDARD';
}

function normalizeLicenseStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(value)) return value;
  return 'ACTIVE';
}

function pickSourceCollection(existingCollections, candidates) {
  for (const candidate of candidates) {
    if (existingCollections.includes(candidate)) return candidate;
  }
  return null;
}

const ENTITY_DEFS = [
  {
    key: 'users',
    sourceCandidates: ['legacy_users', 'old_users', 'users_legacy', 'users_old'],
    target: 'users',
    transform: (doc) => {
      const email = String(doc.email || '').trim().toLowerCase();
      if (!email) return null;
      const passwordHash = String(doc.passwordHash || doc.password_hash || doc.password || '').trim();
      if (!passwordHash) return null;

      return {
        _id: String(doc._id || doc.id || createId()),
        name: String(doc.name || doc.full_name || doc.username || 'Unknown').trim(),
        email,
        phone: doc.phone ? String(doc.phone) : undefined,
        passwordHash,
        role: normalizeRole(doc.role || doc.user_role),
        status: normalizeUserStatus(doc.status),
        createdAt: doc.createdAt || doc.created_at || new Date(),
        updatedAt: doc.updatedAt || doc.updated_at || new Date(),
      };
    },
  },
  {
    key: 'orders',
    sourceCandidates: ['legacy_orders', 'old_orders', 'orders_legacy', 'orders_old'],
    target: 'orders',
    transform: (doc) => {
      const userId = String(doc.userId || doc.user_id || '').trim();
      if (!userId) return null;

      const amountRaw = Number(doc.total || doc.amount || 0);
      const status = String(doc.status || 'PENDING').toUpperCase();
      const normalizedStatus = ['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED'].includes(status)
        ? status
        : 'PENDING';

      return {
        _id: String(doc._id || doc.id || createId()),
        userId,
        orderNumber: String(doc.orderNumber || doc.order_number || `ORD-${Date.now()}`),
        amount: Number.isFinite(amountRaw) ? amountRaw : 0,
        currency: String(doc.currency || 'USD').toUpperCase(),
        status: normalizedStatus,
        items: Array.isArray(doc.items) ? doc.items : [],
        metadata: doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {},
        createdAt: doc.createdAt || doc.created_at || new Date(),
        updatedAt: doc.updatedAt || doc.updated_at || new Date(),
      };
    },
  },
  {
    key: 'payments',
    sourceCandidates: ['legacy_payments', 'old_payments', 'payments_legacy', 'payments_old'],
    target: 'payments',
    transform: (doc) => {
      const userId = String(doc.userId || doc.user_id || '').trim();
      const transactionId = String(doc.transactionId || doc.transaction_id || doc.txn_id || '').trim();
      if (!userId || !transactionId) return null;

      const amountRaw = Number(doc.amount || doc.total || 0);
      return {
        _id: String(doc._id || doc.id || createId()),
        userId,
        amount: Number.isFinite(amountRaw) ? amountRaw : 0,
        currency: String(doc.currency || 'USD').toUpperCase(),
        status: normalizePaymentStatus(doc.status),
        paymentMethod: String(doc.paymentMethod || doc.payment_method || 'unknown').trim(),
        transactionId,
        description: String(doc.description || doc.note || 'legacy migrated payment').trim(),
        metadata: doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {},
        createdAt: doc.createdAt || doc.created_at || new Date(),
        updatedAt: doc.updatedAt || doc.updated_at || new Date(),
      };
    },
  },
  {
    key: 'licenses',
    sourceCandidates: ['legacy_licenses', 'old_licenses', 'licenses_legacy', 'licenses_old'],
    target: 'licenses',
    transform: (doc) => {
      const userId = String(doc.userId || doc.user_id || '').trim();
      const productId = String(doc.productId || doc.product_id || '').trim();
      if (!userId || !productId) return null;

      const expiresAt = doc.expiresAt || doc.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return {
        _id: String(doc._id || doc.id || createId()),
        userId,
        productId,
        licenseKey: String(doc.licenseKey || doc.license_key || `LIC-${createId()}`),
        type: normalizeLicenseType(doc.type),
        status: normalizeLicenseStatus(doc.status),
        expiresAt,
        features: Array.isArray(doc.features) ? doc.features : [],
        metadata: doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {},
        createdAt: doc.createdAt || doc.created_at || new Date(),
        updatedAt: doc.updatedAt || doc.updated_at || new Date(),
      };
    },
  },
];

function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const existingCollections = (await mongoose.connection.db.listCollections().toArray()).map((item) => item.name);
  const summary = {
    mode: APPLY_MODE ? 'apply' : 'dry-run',
    strict: STRICT_MODE,
    timestamp: nowIso(),
    sourceCollections: existingCollections,
    entities: {},
    failures: [],
  };

  for (const entity of ENTITY_DEFS) {
    const sourceName = pickSourceCollection(existingCollections, entity.sourceCandidates);
    if (!sourceName) {
      const targetCollection = mongoose.connection.db.collection(entity.target);
      const targetCount = await targetCollection.countDocuments({});
      const msg = `${entity.key}: source collection missing (candidates: ${entity.sourceCandidates.join(', ')})`;
      if (STRICT_MODE) {
        if (targetCount === 0) {
          summary.failures.push(`${msg}; target collection is also empty`);
        }
      }
      summary.entities[entity.key] = {
        source: null,
        target: entity.target,
        targetCount,
        sourceCount: 0,
        transformedCount: 0,
        invalidCount: 0,
        upsertedCount: 0,
        skipped: true,
        skippedReason: targetCount > 0 ? 'already-migrated' : 'no-source-and-empty-target',
      };
      continue;
    }

    const sourceCollection = mongoose.connection.db.collection(sourceName);
    const targetCollection = mongoose.connection.db.collection(entity.target);

    const sourceDocs = await sourceCollection.find({}).toArray();
    let transformedCount = 0;
    let invalidCount = 0;
    let upsertedCount = 0;

    for (const sourceDoc of sourceDocs) {
      const transformed = entity.transform(sourceDoc);
      if (!transformed) {
        invalidCount += 1;
        continue;
      }

      transformedCount += 1;
      if (APPLY_MODE) {
        const result = await targetCollection.updateOne(
          { _id: transformed._id },
          { $setOnInsert: transformed },
          { upsert: true },
        );
        upsertedCount += result.upsertedCount || 0;
      }
    }

    summary.entities[entity.key] = {
      source: sourceName,
      target: entity.target,
      sourceCount: sourceDocs.length,
      targetCount: await targetCollection.countDocuments({}),
      transformedCount,
      invalidCount,
      upsertedCount,
      skipped: false,
    };
  }

  ensureReportDir();
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  const hasFailures = summary.failures.length > 0;
  if (hasFailures) {
    console.error('DATA MIGRATION FAILED');
    for (const failure of summary.failures) {
      console.error(` - ${failure}`);
    }
    console.error(`Report: ${REPORT_PATH}`);
    process.exit(1);
  }

  console.log(`Data migration ${APPLY_MODE ? 'apply' : 'dry-run'} completed.`);
  console.log(`Report: ${REPORT_PATH}`);
}

run()
  .catch((error) => {
    if (isDatabaseUnavailable(error)) {
      console.warn('DATA MIGRATION SKIPPED: database unavailable');
      process.exit(0);
    }
    console.error('DATA MIGRATION ERROR');
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
  });
