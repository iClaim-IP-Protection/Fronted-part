import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useWallet } from '../context/WalletContext';
import { authAPI } from '../services/api';
import { hashingUtilities, blockchainUtils } from '../services/blockchainService';
import StatusBadge from './StatusBadge';
import './CertifyAssetForm.css';

const CertifyAssetForm = ({ 
  asset,
  onSuccess, 
  onError 
}) => {
  const { certifyAsset, retryTransaction } = useBlockchain();
  const { walletAddress } = useWallet();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | partial_failed | failed
  
  // Transaction states
  const [nftTransaction, setNftTransaction] = useState(null);
  const [certTransaction, setCertTransaction] = useState(null);
  
  // Hashes
  const [nftHash, setNftHash] = useState(null);
  const [certHash, setCertHash] = useState(null);

  // Load user ID on mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        // Try to get user ID from localStorage first (set during login)
        const storedUserId = authAPI.getUserId();
        if (storedUserId) {
          console.log('Using stored user ID from localStorage:', storedUserId);
          setUserId(parseInt(storedUserId));
          return;
        }

        // If not in localStorage, try to fetch from API
        if (authAPI.isAuthenticated()) {
          try {
            const user = await authAPI.getCurrentUser();
            console.log('User profile fetched:', user);
            
            // Try multiple possible ID field names
            const userId = user.id || user.user_id || user.userId || user.ID;
            
            if (userId) {
              setUserId(userId);
              // Also store it in localStorage for future use
              localStorage.setItem('user_id', userId);
            } else {
              // If backend doesn't return ID but has other data, we still have user authenticated
              console.warn('Backend user profile missing ID field. Using fallback approach.', user);
              // Don't block certification - the backend will handle user identification via JWT
              setUserId('authenticated');
            }
          } catch (apiErr) {
            console.error('API error loading user profile:', apiErr);
            // Still allow certification if authenticated via JWT
          }
        } else {
          console.warn('User not authenticated - no JWT token found');
        }
      } catch (err) {
        console.error('Unexpected error in loadUserId:', err);
      }
    };
    
    loadUserId();
  }, []);

  // Validate prerequisites when dependencies change
  useEffect(() => {
    // Only validate if we have an asset to certify
    if (!asset) {
      setError(null);
      return;
    }

    // Check wallet connection
    if (!walletAddress) {
      setError('Please connect your Phantom wallet first');
      return;
    }

    // Check document hash
    if (!asset.document_hash) {
      setError('Asset does not have a document hash. Please re-upload the asset or contact support.');
      return;
    }

    // Check user is authenticated (userId can be numeric or 'authenticated' string)
    if (!userId) {
      // Still loading or failed to load - don't block yet
      return;
    }

    // All checks passed
    setError(null);
  }, [walletAddress, asset, userId]);

  // Check if we can certify (pure function, no side effects)
  const canCertify = () => {
    return walletAddress && asset && asset.document_hash && userId;
  };

  const handleCertify = async () => {
    if (!canCertify()) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('loading');

    try {
      const assetId = asset.asset_id || asset.id;
      const documentHash = asset.document_hash;

      // Generate hashes
      const nft = await hashingUtilities.generateNFTHash(assetId, documentHash);
      setNftHash(nft);

      const cert = await hashingUtilities.generateCertificateHash(userId, nft);
      setCertHash(cert);

      // Call certify endpoint
      const response = await certifyAsset(assetId, nft, cert);

      // Update transaction states
      setNftTransaction(response.nft_transaction);
      setCertTransaction(response.certificate_transaction);
      setStatus('success');

      // Start polling for transaction status
      startPolling(
        response.nft_transaction.transaction_id,
        response.certificate_transaction.transaction_id
      );

      if (onSuccess) {
        onSuccess({
          assetId,
          nftTransaction: response.nft_transaction,
          certTransaction: response.certificate_transaction,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Certification failed';
      setError(errorMsg);
      setStatus('failed');
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = async (nftTxId, certTxId) => {
    try {
      const [nftResult, certResult] = await Promise.all([
        pollTransactionWithUpdates(nftTxId, 'nft'),
        pollTransactionWithUpdates(certTxId, 'cert'),
      ]);

      // Update final states
      if (nftResult) setNftTransaction(nftResult);
      if (certResult) setCertTransaction(certResult);

      // Determine overall status
      const nftConfirmed = nftResult?.status === 'confirmed';
      const certConfirmed = certResult?.status === 'confirmed';

      if (nftConfirmed && certConfirmed) {
        setStatus('confirmed');
      } else if (!nftConfirmed || !certConfirmed) {
        setStatus('partial_failed');
      }
    } catch (err) {
      console.error('Polling error:', err);
      setStatus('polling_error');
    }
  };

  const pollTransactionWithUpdates = async (txId, type) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;

      const poll = async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/api/blockchain/transaction/${txId}/status`,
            {
              headers: {
                'Authorization': `Bearer ${authAPI.getToken()}`,
              },
            }
          );

          if (!response.ok) throw new Error('Failed to get status');

          const status = await response.json();

          // Update state
          if (type === 'nft') {
            setNftTransaction(status);
          } else {
            setCertTransaction(status);
          }

          if (status.status === 'confirmed' || status.status === 'failed') {
            resolve(status);
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            resolve(null); // Timeout, but don't reject
            return;
          }

          setTimeout(poll, 5000);
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(err);
            return;
          }
          setTimeout(poll, 5000);
        }
      };

      poll();
    });
  };

  const handleRetry = async (txId, type) => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryTransaction(txId, type);
      
      if (type === 'nft') {
        setNftTransaction(result);
      } else {
        setCertTransaction(result);
      }

      // Restart polling
      if (nftTransaction && certTransaction) {
        startPolling(
          type === 'nft' ? result.transaction_id : nftTransaction.transaction_id,
          type === 'cert' ? result.transaction_id : certTransaction.transaction_id
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openBlockchainLink = (signature) => {
    const url = blockchainUtils.getSolanaExplorerUrl(signature, 'devnet');
    window.open(url, '_blank');
  };

  return (
    <div className="certify-asset-form">
      <div className="form-card">
        <h2>🚀 Mint NFT & Certificate</h2>
        <p className="form-description">
          Finalize your asset certification by creating NFT and Certificate transactions on Solana blockchain
        </p>

        {/* Asset Info */}
        {asset && (
          <div className="asset-info">
            <div className="info-item">
              <span className="info-label">Asset:</span>
              <span className="info-value">{asset.asset_title}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Asset ID:</span>
              <code className="info-value">{asset.asset_id || asset.id}</code>
            </div>
            {asset.document_hash && (
              <div className="info-item">
                <span className="info-label">Document Hash:</span>
                <code className="info-value">{asset.document_hash}</code>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            ❌ {error}
          </div>
        )}

        {/* Prerequisites Check */}
        {!walletAddress && status === 'idle' && (
          <div className="warning-message">
            ⚠️ Please connect your Phantom wallet first
          </div>
        )}

        {!asset?.document_hash && status === 'idle' && (
          <div className="warning-message">
            ⚠️ Asset does not have a document hash. Please ensure the asset was uploaded correctly.
          </div>
        )}

        {/* Loading State */}
        {loading && status === 'loading' && (
          <div className="status-message processing">
            ⏳ Certifying asset and minting NFT...
          </div>
        )}

        {/* Transaction Display */}
        {(nftTransaction || certTransaction) && (
          <div className="transactions-section">
            <h3>Blockchain Transactions</h3>
            
            {/* NFT Transaction */}
            {nftTransaction && (
              <div className="transaction-card">
                <div className="transaction-header">
                  <h4>NFT Transaction</h4>
                  <StatusBadge status={nftTransaction.status} />
                </div>

                <div className="transaction-details">
                  <div className="detail">
                    <span className="label">Type:</span>
                    <span className="value">NFT Mint</span>
                  </div>

                  <div className="detail">
                    <span className="label">Signature:</span>
                    <code className="value signature">
                      {blockchainUtils.formatSignature(nftTransaction.transaction_signature)}
                    </code>
                    <button
                      className="small-btn copy-btn"
                      onClick={() => blockchainUtils.copyToClipboard(nftTransaction.transaction_signature)}
                      title="Copy signature"
                      aria-label="Copy transaction signature"
                    >
                      📋
                    </button>
                  </div>

                  {nftTransaction.block_number && (
                    <div className="detail">
                      <span className="label">Block:</span>
                      <span className="value">#{nftTransaction.block_number}</span>
                    </div>
                  )}

                  <div className="detail">
                    <span className="label">Created:</span>
                    <span className="value">
                      {blockchainUtils.formatDate(nftTransaction.date_created)}
                    </span>
                  </div>

                  {nftTransaction.date_confirmed && (
                    <div className="detail">
                      <span className="label">Confirmed:</span>
                      <span className="value">
                        {blockchainUtils.formatDate(nftTransaction.date_confirmed)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="transaction-actions">
                  {nftTransaction.status === 'confirmed' && (
                    <button
                      className="link-btn"
                      onClick={() => openBlockchainLink(nftTransaction.transaction_signature)}
                      title="View on Solana Explorer"
                    >
                      🔗 View on Blockchain
                    </button>
                  )}

                  {nftTransaction.status === 'failed' && (
                    <button
                      className="btn btn-retry"
                      onClick={() => handleRetry(nftTransaction.transaction_id, 'nft')}
                      disabled={loading}
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Certificate Transaction */}
            {certTransaction && (
              <div className="transaction-card">
                <div className="transaction-header">
                  <h4>Certificate Transaction</h4>
                  <StatusBadge status={certTransaction.status} />
                </div>

                <div className="transaction-details">
                  <div className="detail">
                    <span className="label">Type:</span>
                    <span className="value">Certificate Mint</span>
                  </div>

                  <div className="detail">
                    <span className="label">Signature:</span>
                    <code className="value signature">
                      {blockchainUtils.formatSignature(certTransaction.transaction_signature)}
                    </code>
                    <button
                      className="small-btn copy-btn"
                      onClick={() => blockchainUtils.copyToClipboard(certTransaction.transaction_signature)}
                      title="Copy signature"
                      aria-label="Copy transaction signature"
                    >
                      📋
                    </button>
                  </div>

                  {certTransaction.block_number && (
                    <div className="detail">
                      <span className="label">Block:</span>
                      <span className="value">#{certTransaction.block_number}</span>
                    </div>
                  )}

                  <div className="detail">
                    <span className="label">Created:</span>
                    <span className="value">
                      {blockchainUtils.formatDate(certTransaction.date_created)}
                    </span>
                  </div>

                  {certTransaction.date_confirmed && (
                    <div className="detail">
                      <span className="label">Confirmed:</span>
                      <span className="value">
                        {blockchainUtils.formatDate(certTransaction.date_confirmed)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="transaction-actions">
                  {certTransaction.status === 'confirmed' && (
                    <button
                      className="link-btn"
                      onClick={() => openBlockchainLink(certTransaction.transaction_signature)}
                      title="View on Solana Explorer"
                    >
                      🔗 View on Blockchain
                    </button>
                  )}

                  {certTransaction.status === 'failed' && (
                    <button
                      className="btn btn-retry"
                      onClick={() => handleRetry(certTransaction.transaction_id, 'cert')}
                      disabled={loading}
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {status === 'confirmed' && (
          <div className="success-message">
            ✅ Asset certified successfully! Both transactions are confirmed on the blockchain.
          </div>
        )}

        {(status === 'success' || status === 'polling_error') && (
          <div className="info-message">
            ℹ️ Transactions submitted. Check back soon for blockchain confirmation.
          </div>
        )}

        {/* Hashes Display */}
        {(nftHash || certHash) && (
          <div className="hashes-section">
            <h3>Generated Hashes</h3>
            
            {nftHash && (
              <div className="hash-item">
                <span className="hash-label">NFT Hash:</span>
                <code className="hash-value">{nftHash}</code>
              </div>
            )}
            
            {certHash && (
              <div className="hash-item">
                <span className="hash-label">Certificate Hash:</span>
                <code className="hash-value">{certHash}</code>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {status === 'idle' && (
          <button
            className="btn btn-primary btn-large"
            onClick={handleCertify}
            disabled={!canCertify() || loading}
            aria-label="Certify asset"
          >
            {loading ? '⏳ Processing...' : '🚀 Certify Asset & Mint NFT'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CertifyAssetForm;
