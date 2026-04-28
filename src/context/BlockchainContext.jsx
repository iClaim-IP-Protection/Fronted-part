import React, { createContext, useContext, useState, useCallback } from 'react';
import { blockchainAPI } from '../services/blockchainService';

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  // Proof of Originality state
  const [proofState, setProofState] = useState({
    assetId: null,
    documentHash: null,
    status: 'idle', // idle | loading | confirmed | failed
    timestamp: null,
    error: null,
  });

  // Certification state
  const [certificationState, setCertificationState] = useState({
    assetId: null,
    nftHash: null,
    certificateHash: null,
    nftTransaction: null,
    certTransaction: null,
    status: 'idle', // idle | loading | success | partial_failed | failed
    error: null,
  });

  // Transaction polling state
  const [pollingState, setPollingState] = useState({
    isPolling: false,
    pollAttempts: 0,
    maxAttempts: 30,
  });

  // Transaction history
  const [transactions, setTransactions] = useState({});

  /**
   * Record proof of originality
   */
  const recordProofOfOriginality = useCallback(
    async (assetId, documentHash) => {
      setProofState(prev => ({
        ...prev,
        status: 'loading',
        error: null,
        assetId,
        documentHash,
      }));

      try {
        const response = await blockchainAPI.recordProofOfOriginality(assetId, documentHash);
        
        setProofState(prev => ({
          ...prev,
          status: 'confirmed',
          timestamp: response.timestamp,
          assetId,
          documentHash,
        }));

        // Store in localStorage for offline access
        localStorage.setItem(
          `proof_${assetId}`,
          JSON.stringify({
            documentHash,
            timestamp: response.timestamp,
            status: 'confirmed',
          })
        );

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record proof of originality';
        setProofState(prev => ({
          ...prev,
          status: 'failed',
          error: errorMsg,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Certify asset and mint NFT
   */
  const certifyAsset = useCallback(
    async (assetId, nftHash, certificateHash) => {
      setCertificationState(prev => ({
        ...prev,
        status: 'loading',
        error: null,
        assetId,
        nftHash,
        certificateHash,
      }));

      try {
        const response = await blockchainAPI.certifyAsset(assetId, nftHash, certificateHash);

        setCertificationState(prev => ({
          ...prev,
          status: 'success',
          assetId,
          nftHash,
          certificateHash,
          nftTransaction: response.nft_transaction,
          certTransaction: response.certificate_transaction,
        }));

        // Store in localStorage
        localStorage.setItem(
          `certification_${assetId}`,
          JSON.stringify({
            nftHash,
            certificateHash,
            nftTxId: response.nft_transaction.transaction_id,
            certTxId: response.certificate_transaction.transaction_id,
            status: 'pending',
            createdAt: new Date().toISOString(),
          })
        );

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Certification failed';
        setCertificationState(prev => ({
          ...prev,
          status: 'failed',
          error: errorMsg,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Get transaction status
   */
  const getTransactionStatus = useCallback(async (transactionId) => {
    try {
      return await blockchainAPI.getTransactionStatus(transactionId);
    } catch (err) {
      console.error(`Failed to get status for transaction ${transactionId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Retry failed transaction
   */
  const retryTransaction = useCallback(
    async (transactionId, transactionType = 'nft') => {
      try {
        const response = await blockchainAPI.retryTransaction(transactionId);

        // Update local state
        if (transactionType === 'nft') {
          setCertificationState(prev => ({
            ...prev,
            nftTransaction: response,
          }));
        } else {
          setCertificationState(prev => ({
            ...prev,
            certTransaction: response,
          }));
        }

        return response;
      } catch (err) {
        console.error(`Failed to retry transaction ${transactionId}:`, err);
        throw err;
      }
    },
    []
  );

  /**
   * Get all transactions for an asset
   */
  const getAssetTransactions = useCallback(async (assetId) => {
    try {
      const response = await blockchainAPI.getAssetTransactions(assetId);
      
      setTransactions(prev => ({
        ...prev,
        [assetId]: response.transactions,
      }));

      return response.transactions;
    } catch (err) {
      console.error(`Failed to get transactions for asset ${assetId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Poll transaction status until confirmed or failed
   */
  const pollTransactionStatus = useCallback(
    async (transactionId, onUpdate = null) => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = pollingState.maxAttempts;

        const poll = async () => {
          try {
            const status = await getTransactionStatus(transactionId);

            if (onUpdate) {
              onUpdate(status);
            }

            if (status.status === 'confirmed' || status.status === 'failed') {
              resolve(status);
              return;
            }

            attempts++;
            if (attempts >= maxAttempts) {
              reject(new Error('Transaction polling timeout'));
              return;
            }

            // Wait 5 seconds before next poll
            setTimeout(poll, 5000);
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              reject(error);
              return;
            }
            setTimeout(poll, 5000);
          }
        };

        poll();
      });
    },
    [pollingState.maxAttempts, getTransactionStatus]
  );

  /**
   * Poll both NFT and Certificate transactions
   */
  const pollBothTransactions = useCallback(
    async (nftTxId, certTxId, onNftUpdate = null, onCertUpdate = null) => {
      try {
        setPollingState(prev => ({
          ...prev,
          isPolling: true,
          pollAttempts: 0,
        }));

        const [nftResult, certResult] = await Promise.all([
          pollTransactionStatus(nftTxId, onNftUpdate),
          pollTransactionStatus(certTxId, onCertUpdate),
        ]);

        setPollingState(prev => ({
          ...prev,
          isPolling: false,
        }));

        return { nftResult, certResult };
      } catch (error) {
        setPollingState(prev => ({
          ...prev,
          isPolling: false,
        }));
        console.error('Error polling transactions:', error);
        throw error;
      }
    },
    [pollTransactionStatus]
  );

  /**
   * Reset all states
   */
  const resetStates = useCallback(() => {
    setProofState({
      assetId: null,
      documentHash: null,
      status: 'idle',
      timestamp: null,
      error: null,
    });

    setCertificationState({
      assetId: null,
      nftHash: null,
      certificateHash: null,
      nftTransaction: null,
      certTransaction: null,
      status: 'idle',
      error: null,
    });

    setPollingState({
      isPolling: false,
      pollAttempts: 0,
      maxAttempts: 30,
    });
  }, []);

  const value = {
    // State
    proofState,
    certificationState,
    pollingState,
    transactions,

    // Methods
    recordProofOfOriginality,
    certifyAsset,
    getTransactionStatus,
    retryTransaction,
    getAssetTransactions,
    pollTransactionStatus,
    pollBothTransactions,
    resetStates,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};
