import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../services/blockchainService';
import { useBlockchain } from '../context/BlockchainContext';
import { authAPI } from '../services/api';
import { blockchainUtils } from '../services/blockchainService';
import StatusBadge from './StatusBadge';
import './TransactionHistoryView.css';

const TransactionHistoryView = ({ assetId }) => {
  const { getAssetTransactions, retryTransaction } = useBlockchain();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(null);

  useEffect(() => {
    if (!assetId) return;

    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const txs = await getAssetTransactions(assetId);
        setTransactions(txs || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load transactions';
        setError(errorMsg);
        console.error('Error loading transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [assetId, getAssetTransactions]);

  const handleRetry = async (txId) => {
    setRetrying(txId);
    setError(null);

    try {
      const result = await retryTransaction(txId);
      
      // Update transaction in list
      setTransactions(prev =>
        prev.map(tx => tx.transaction_id === txId ? result : tx)
      );

      // Clear retrying state after a short delay
      setTimeout(() => setRetrying(null), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMsg);
      setRetrying(null);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const txs = await getAssetTransactions(assetId);
      setTransactions(txs || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh transactions';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeName = (type) => {
    switch (type?.toLowerCase()) {
      case 'nft_mint':
        return 'NFT Mint';
      case 'certificate_mint':
        return 'Certificate Mint';
      default:
        return type || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="transaction-history-view">
        <div className="loading">
          <span className="spinner">⏳</span> Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-view">
      <div className="history-header">
        <h3>Transaction History</h3>
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh transactions"
          aria-label="Refresh transaction history"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          ❌ {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found for this asset yet.</p>
          <p className="hint">Transactions will appear here once you certify your asset.</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div
              key={tx.transaction_id}
              className="transaction-item"
              data-status={tx.status?.toLowerCase()}
            >
              {/* Header Row */}
              <div className="transaction-row header-row">
                <div className="transaction-type">
                  <span className="type-name">
                    {getTransactionTypeName(tx.transaction_type)}
                  </span>
                </div>
                <div className="transaction-status">
                  <StatusBadge status={tx.status} />
                </div>
              </div>

              {/* Details Grid */}
              <div className="transaction-row details-row">
                <div className="detail-column">
                  <div className="detail-item">
                    <span className="detail-label">Signature:</span>
                    <div className="detail-value-group">
                      <code className="detail-value signature">
                        {blockchainUtils.formatSignature(tx.transaction_signature)}
                      </code>
                      <button
                        className="small-btn copy-btn"
                        onClick={() => blockchainUtils.copyToClipboard(tx.transaction_signature)}
                        title="Copy full signature"
                        aria-label="Copy transaction signature"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  {tx.block_number && (
                    <div className="detail-item">
                      <span className="detail-label">Block:</span>
                      <span className="detail-value">#{tx.block_number}</span>
                    </div>
                  )}
                </div>

                <div className="detail-column">
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {blockchainUtils.formatDate(tx.date_created)}
                    </span>
                  </div>

                  {tx.date_confirmed && (
                    <div className="detail-item">
                      <span className="detail-label">Confirmed:</span>
                      <span className="detail-value">
                        {blockchainUtils.formatDate(tx.date_confirmed)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Hash */}
              {tx.data_hash && (
                <div className="transaction-row data-hash-row">
                  <div className="detail-item full-width">
                    <span className="detail-label">Data Hash:</span>
                    <div className="detail-value-group">
                      <code className="detail-value data-hash">
                        {tx.data_hash}
                      </code>
                      <button
                        className="small-btn copy-btn"
                        onClick={() => blockchainUtils.copyToClipboard(tx.data_hash)}
                        title="Copy data hash"
                        aria-label="Copy data hash"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Row */}
              <div className="transaction-row actions-row">
                <div className="transaction-actions">
                  {tx.status?.toLowerCase() === 'confirmed' && (
                    <a
                      href={blockchainUtils.getSolanaExplorerUrl(tx.transaction_signature, 'devnet')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn explorer-btn"
                      title="View on Solana Explorer"
                      aria-label="View transaction on Solana Explorer"
                    >
                      🔗 View on Explorer
                    </a>
                  )}

                  {tx.status?.toLowerCase() === 'failed' && (
                    <button
                      className="action-btn retry-btn"
                      onClick={() => handleRetry(tx.transaction_id)}
                      disabled={retrying === tx.transaction_id}
                      title="Retry failed transaction"
                      aria-label="Retry failed transaction"
                    >
                      {retrying === tx.transaction_id ? '⏳ Retrying...' : '🔄 Retry'}
                    </button>
                  )}

                  {tx.status?.toLowerCase() === 'pending' && (
                    <span className="pending-hint">
                      ⏳ Awaiting blockchain confirmation...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {transactions.length > 0 && (
        <div className="legend">
          <p className="legend-title">Status Legend:</p>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-icon confirmed">✅</span>
              <span>Confirmed on blockchain</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon pending">⏳</span>
              <span>Pending confirmation</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon failed">❌</span>
              <span>Failed (can be retried)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryView;
