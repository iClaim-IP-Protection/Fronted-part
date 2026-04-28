import { blockchainAPI } from './blockchainService';

/**
 * Transaction Polling Utility
 * Provides functions to poll for transaction status updates
 */

/**
 * Poll a single transaction until it's confirmed or fails
 * @param {number} transactionId - Transaction ID to poll
 * @param {Object} options - Polling options
 * @param {number} options.maxAttempts - Maximum number of polling attempts (default: 30)
 * @param {number} options.interval - Time between polls in milliseconds (default: 5000)
 * @param {Function} options.onUpdate - Callback function called with each status update
 * @param {Function} options.onConfirmed - Callback called when transaction is confirmed
 * @param {Function} options.onFailed - Callback called when transaction fails
 * @param {Function} options.onTimeout - Callback called when polling timeout is reached
 * @returns {Promise<Object>} - Final transaction status
 */
export const pollSingleTransaction = async (transactionId, options = {}) => {
  const {
    maxAttempts = 30,
    interval = 5000,
    onUpdate = null,
    onConfirmed = null,
    onFailed = null,
    onTimeout = null,
  } = options;

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await blockchainAPI.getTransactionStatus(transactionId);

        // Call update callback
        if (onUpdate) {
          onUpdate(status);
        }

        // Check if transaction is finalized
        if (status.status === 'confirmed') {
          if (onConfirmed) {
            onConfirmed(status);
          }
          resolve(status);
          return;
        }

        if (status.status === 'failed') {
          if (onFailed) {
            onFailed(status);
          }
          resolve(status); // Don't reject, just resolve with failed status
          return;
        }

        // Continue polling
        attempts++;
        if (attempts >= maxAttempts) {
          const timeoutError = new Error(`Transaction polling timeout after ${attempts} attempts`);
          if (onTimeout) {
            onTimeout(timeoutError);
          }
          resolve(null); // Return null instead of rejecting
          return;
        }

        setTimeout(poll, interval);
      } catch (error) {
        console.error(`Error polling transaction ${transactionId}:`, error);
        attempts++;

        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }

        // Retry after error
        setTimeout(poll, interval);
      }
    };

    poll();
  });
};

/**
 * Poll multiple transactions in parallel
 * @param {Array<number>} transactionIds - Array of transaction IDs to poll
 * @param {Object} options - Same options as pollSingleTransaction
 * @returns {Promise<Array<Object>>} - Array of final transaction statuses
 */
export const pollMultipleTransactions = async (transactionIds, options = {}) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw new Error('transactionIds must be a non-empty array');
  }

  const promises = transactionIds.map(txId =>
    pollSingleTransaction(txId, options)
  );

  return Promise.all(promises);
};

/**
 * Poll multiple transactions and wait for all to be confirmed
 * @param {Array<number>} transactionIds - Array of transaction IDs
 * @param {Object} options - Polling options
 * @returns {Promise<{confirmed: Array, failed: Array, timeout: Array}>}
 */
export const pollUntilAllConfirmed = async (transactionIds, options = {}) => {
  const {
    maxAttempts = 30,
    interval = 5000,
  } = options;

  const results = {
    confirmed: [],
    failed: [],
    timeout: [],
  };

  let attempts = 0;

  return new Promise(async (resolve, reject) => {
    const poll = async () => {
      try {
        // Get status of all transactions
        const statuses = await Promise.all(
          transactionIds.map(txId => blockchainAPI.getTransactionStatus(txId))
        );

        // Categorize results
        results.confirmed = statuses.filter(s => s.status === 'confirmed');
        results.failed = statuses.filter(s => s.status === 'failed');

        // Check if all are finalized
        const allFinalized = statuses.every(s => 
          s.status === 'confirmed' || s.status === 'failed'
        );

        if (allFinalized) {
          resolve(results);
          return;
        }

        // Check if we've exceeded max attempts
        attempts++;
        if (attempts >= maxAttempts) {
          results.timeout = statuses.filter(s => 
            s.status !== 'confirmed' && s.status !== 'failed'
          );
          resolve(results);
          return;
        }

        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Error polling transactions:', error);
        reject(error);
      }
    };

    poll();
  });
};

/**
 * Create an interval-based poller that updates state continuously
 * Useful for components that need real-time updates
 * @param {Array<number>} transactionIds - Transaction IDs to poll
 * @param {Function} onStatusChange - Callback with updated statuses
 * @param {Object} options - Polling options
 * @returns {Function} - Stop function to cancel polling
 */
export const createContinuousPoller = (transactionIds, onStatusChange, options = {}) => {
  const {
    interval = 5000,
    maxDuration = null, // Max total polling time in ms
  } = options;

  let pollInterval = null;
  let startTime = Date.now();
  let isStopped = false;

  const poll = async () => {
    if (isStopped) return;

    // Check max duration
    if (maxDuration && Date.now() - startTime > maxDuration) {
      stop();
      return;
    }

    try {
      const statuses = await Promise.all(
        transactionIds.map(txId => blockchainAPI.getTransactionStatus(txId))
      );

      if (!isStopped) {
        onStatusChange(statuses);
      }

      // Stop if all are finalized
      const allFinalized = statuses.every(s =>
        s.status === 'confirmed' || s.status === 'failed'
      );

      if (allFinalized) {
        stop();
      }
    } catch (error) {
      console.error('Error in continuous poller:', error);
      // Continue polling on error
    }
  };

  // Start polling
  pollInterval = setInterval(poll, interval);
  
  // Poll immediately
  poll();

  // Return stop function
  const stop = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    isStopped = true;
  };

  return stop;
};

/**
 * Batch poll with exponential backoff
 * Useful for handling rate limits
 * @param {Array<number>} transactionIds - Transaction IDs to poll
 * @param {Object} options - Polling options
 * @returns {Promise<Array<Object>>} - Array of final statuses
 */
export const pollWithExponentialBackoff = async (transactionIds, options = {}) => {
  const {
    initialInterval = 1000,
    maxInterval = 30000,
    backoffMultiplier = 1.5,
    maxAttempts = 30,
  } = options;

  let interval = initialInterval;
  let attempts = 0;

  return new Promise(async (resolve, reject) => {
    const poll = async () => {
      try {
        const statuses = await Promise.all(
          transactionIds.map(txId => blockchainAPI.getTransactionStatus(txId))
        );

        // Check if all are finalized
        const allFinalized = statuses.every(s =>
          s.status === 'confirmed' || s.status === 'failed'
        );

        if (allFinalized) {
          resolve(statuses);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          resolve(statuses); // Return whatever we have
          return;
        }

        // Increase interval with exponential backoff
        interval = Math.min(interval * backoffMultiplier, maxInterval);
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Error in exponential backoff poller:', error);
        reject(error);
      }
    };

    poll();
  });
};

/**
 * Retry a failed transaction with human-friendly status messages
 * @param {number} transactionId - Transaction ID to retry
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} - Result of retry
 */
export const retryFailedTransaction = async (transactionId, options = {}) => {
  const {
    maxRetries = 3,
    onRetryAttempt = null,
  } = options;

  let retries = 0;

  while (retries < maxRetries) {
    try {
      if (onRetryAttempt) {
        onRetryAttempt({
          attempt: retries + 1,
          maxRetries,
          transactionId,
        });
      }

      const result = await blockchainAPI.retryTransaction(transactionId);
      return result;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(
          `Failed to retry transaction after ${maxRetries} attempts: ${error.message}`
        );
      }

      // Wait before retrying (with exponential backoff)
      const waitTime = Math.pow(2, retries - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export default {
  pollSingleTransaction,
  pollMultipleTransactions,
  pollUntilAllConfirmed,
  createContinuousPoller,
  pollWithExponentialBackoff,
  retryFailedTransaction,
};
