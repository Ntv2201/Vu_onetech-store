const mongoose = require('mongoose');

/**
 * Utility to run an async operation inside a MongoDB transaction.
 * Fallbacks to executing without transaction if MongoDB is running in standalone mode
 * or in the test environment where replica set is not available.
 *
 * @param {Function} callback - Async function that takes (session) as argument
 * @returns {Promise<any>}
 */
async function runInTransaction(callback) {
  let session = null;
  // Kiểm tra xem Mongoose có hỗ trợ transaction không (yêu cầu Replica Set)
  // Trong môi trường test mặc định có thể không phải replica set
  const isReplicaSet = mongoose.connection.client && 
                       mongoose.connection.client.topology && 
                       mongoose.connection.client.topology.s && 
                       mongoose.connection.client.topology.s.description && 
                       mongoose.connection.client.topology.s.description.type.startsWith('ReplicaSet');
                       
  const isTestEnv = process.env.NODE_ENV === 'test';

  if (isReplicaSet && !isTestEnv) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const result = await callback(session);
    if (session) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = {
  runInTransaction
};
