const mongoose = require('mongoose');

/**
 * Execute an operation inside a MongoDB transaction.
 * If running on a standalone MongoDB instance that doesn't support replica sets,
 * falls back gracefully to executing without a session.
 */
const runInTransaction = async (operation) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await operation(session);

    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignore abort errors if transaction was never started
      }
    }

    // Check if error is due to MongoDB standalone not supporting transactions
    if (
      err.message &&
      (err.message.includes('replica set') ||
        err.message.includes('Transaction numbers are only allowed') ||
        err.message.includes('Transactions are not supported'))
    ) {
      console.warn('[Transaction] Standalone MongoDB detected. Running fallback operation without replica set session.');
      return operation(null);
    }

    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  runInTransaction
};
