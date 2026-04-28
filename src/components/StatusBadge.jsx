import React from 'react';
import { blockchainUtils } from '../services/blockchainService';
import './StatusBadge.css';

const StatusBadge = ({ status = 'pending' }) => {
  const icon = blockchainUtils.getStatusIcon(status);
  const color = blockchainUtils.getStatusColor(status);
  const statusText = status?.toUpperCase() || 'UNKNOWN';

  const getAriaLabel = () => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Transaction confirmed on blockchain';
      case 'pending':
        return 'Transaction pending confirmation';
      case 'failed':
        return 'Transaction failed';
      default:
        return `Transaction status: ${statusText}`;
    }
  };

  return (
    <div
      className={`status-badge status-${status?.toLowerCase()}`}
      style={{ borderColor: color }}
      role="status"
      aria-label={getAriaLabel()}
      title={statusText}
    >
      <span className="status-icon">{icon}</span>
      <span className="status-text">{statusText}</span>
    </div>
  );
};

export default StatusBadge;
