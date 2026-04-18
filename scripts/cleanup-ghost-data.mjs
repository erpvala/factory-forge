#!/usr/bin/env node
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-forge';
const APPLY_MODE = process.argv.includes('--apply');

function isDatabaseUnavailable(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /ECONNREFUSED|MongooseServerSelectionError|connect ETIMEDOUT|server selection/i.test(message);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  const collections = (await mongoose.connection.db.listCollections().toArray()).map((item) => item.name);

  const users = mongoose.connection.db.collection('users');
  const payments = mongoose.connection.db.collection('payments');
  const licenses = mongoose.connection.db.collection('licenses');
  const eventBusCollectionName = collections.includes('eventbuses') ? 'eventbuses' : 'eventbus';
  const eventBus = mongoose.connection.db.collection(eventBusCollectionName);

  const userIds = new Set(
    (await users.find({}, { projection: { _id: 1 } }).toArray()).map((doc) => String(doc._id)),
  );

  const paymentDocs = await payments.find({}, { projection: { _id: 1, userId: 1 } }).toArray();
  const licenseDocs = await licenses.find({}, { projection: { _id: 1, userId: 1 } }).toArray();

  const orphanPaymentIds = paymentDocs
    .filter((doc) => !doc.userId || !userIds.has(String(doc.userId)))
    .map((doc) => doc._id);

  const orphanLicenseIds = licenseDocs
    .filter((doc) => !doc.userId || !userIds.has(String(doc.userId)))
    .map((doc) => doc._id);

  const brokenEventFilter = {
    $or: [
      { eventType: { $exists: false } },
      { eventType: '' },
      { source: { $exists: false } },
      { source: '' },
      { data: { $exists: false } },
      { timestamp: { $exists: false } },
    ],
  };

  const brokenEventCount = await eventBus.countDocuments(brokenEventFilter);

  if (APPLY_MODE) {
    if (orphanPaymentIds.length > 0) {
      await payments.deleteMany({ _id: { $in: orphanPaymentIds } });
    }
    if (orphanLicenseIds.length > 0) {
      await licenses.deleteMany({ _id: { $in: orphanLicenseIds } });
    }
    if (brokenEventCount > 0) {
      await eventBus.deleteMany(brokenEventFilter);
    }
  }

  const summary = {
    mode: APPLY_MODE ? 'apply' : 'dry-run',
    orphanPayments: orphanPaymentIds.length,
    orphanLicenses: orphanLicenseIds.length,
    brokenEventBusRecords: brokenEventCount,
  };

  const hasGhosts =
    summary.orphanPayments > 0 ||
    summary.orphanLicenses > 0 ||
    summary.brokenEventBusRecords > 0;

  if (hasGhosts && !APPLY_MODE) {
    console.error('GHOST DATA DETECTED');
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log(`Ghost data cleanup ${APPLY_MODE ? 'applied' : 'validated'}:`);
  console.log(JSON.stringify(summary, null, 2));
}

run()
  .catch((error) => {
    if (isDatabaseUnavailable(error)) {
      console.warn('GHOST CLEANUP SKIPPED: database unavailable');
      process.exit(0);
    }
    console.error('GHOST CLEANUP ERROR');
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
