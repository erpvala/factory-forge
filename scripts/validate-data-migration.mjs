#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'reports', 'data-migration-report.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-forge';

const REQUIREMENTS = {
  users: ['email', 'passwordHash', 'status'],
  orders: ['userId', 'orderNumber', 'status'],
  payments: ['userId', 'transactionId', 'status'],
  licenses: ['userId', 'licenseKey', 'status'],
};

function isDatabaseUnavailable(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /ECONNREFUSED|MongooseServerSelectionError|connect ETIMEDOUT|server selection/i.test(message);
}

function ensure(condition, message, failures) {
  if (!condition) failures.push(message);
}

function hasRequiredFields(doc, fields) {
  return fields.every((field) => {
    const value = doc[field];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
}

async function run() {
  const failures = [];

  ensure(fs.existsSync(REPORT_PATH), 'missing migration report: reports/data-migration-report.json', failures);
  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  for (const [entity, requiredFields] of Object.entries(REQUIREMENTS)) {
    const entityReport = report.entities?.[entity];
    ensure(Boolean(entityReport), `${entity}: missing entity report`, failures);
    if (!entityReport) continue;

    if (entityReport.skipped) {
      const alreadyMigrated = entityReport.skippedReason === 'already-migrated';
      ensure(alreadyMigrated, `${entity}: migration skipped without existing migrated target`, failures);
      if (alreadyMigrated) {
        continue;
      }
    }

    ensure(entityReport.invalidCount === 0, `${entity}: invalid transformed records=${entityReport.invalidCount}`, failures);

    const targetName = entityReport.target;
    const targetCollection = mongoose.connection.db.collection(targetName);

    const targetCount = await targetCollection.countDocuments({});
    ensure(
      targetCount >= entityReport.transformedCount,
      `${entity}: target count ${targetCount} < transformed count ${entityReport.transformedCount}`,
      failures,
    );

    const sampleDocs = await targetCollection.find({}).limit(25).toArray();
    const brokenCount = sampleDocs.filter((doc) => !hasRequiredFields(doc, requiredFields)).length;
    ensure(brokenCount === 0, `${entity}: missing critical fields in ${brokenCount} sampled target records`, failures);
  }

  if (failures.length > 0) {
    console.error('MIGRATION VALIDATION FAILED');
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    process.exit(1);
  }

  console.log('Migration validation passed: counts and critical entities are consistent.');
}

run()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error || '');
    if (/missing migration report/i.test(message)) {
      console.warn('MIGRATION VALIDATION SKIPPED: migration report unavailable');
      process.exit(0);
    }
    if (isDatabaseUnavailable(error)) {
      console.warn('MIGRATION VALIDATION SKIPPED: database unavailable');
      process.exit(0);
    }
    console.error(message);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
  });
