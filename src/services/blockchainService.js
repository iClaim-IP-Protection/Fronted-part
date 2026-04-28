import { authAPI } from './api';

const API_BASE_URL = 'http://localhost:8000';

// Helper function for blockchain API calls
const blockchainApiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = authAPI.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const finalError = new Error(message);
    console.error('Blockchain API Error:', finalError);
    throw finalError;
  }
};

// Hash generation utilities
export const hashingUtilities = {
  /**
   * Generate SHA-256 hash of file content
   * @param {File | Uint8Array} fileContent - File or buffer to hash
   * @returns {Promise<string>} - Hex string of hash
   */
  generateDocumentHash: async (fileContent) => {
    try {
      const buffer = fileContent instanceof File 
        ? await fileContent.arrayBuffer()
        : fileContent;
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating document hash:', error);
      throw new Error('Failed to generate document hash');
    }
  },

  /**
   * Generate NFT hash: SHA256(asset_id:document_hash)
   * @param {number} assetId - The asset ID
   * @param {string} documentHash - The document hash
   * @returns {Promise<string>} - Hex string of NFT hash
   */
  generateNFTHash: async (assetId, documentHash) => {
    try {
      const combined = `${assetId}:${documentHash}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating NFT hash:', error);
      throw new Error('Failed to generate NFT hash');
    }
  },

  /**
   * Generate Certificate hash: SHA256(user_id:nft_hash:timestamp)
   * @param {number} userId - The user ID
   * @param {string} nftHash - The NFT hash
   * @param {string} timestamp - ISO timestamp (optional, uses current time if not provided)
   * @returns {Promise<string>} - Hex string of certificate hash
   */
  generateCertificateHash: async (userId, nftHash, timestamp = null) => {
    try {
      const ts = timestamp || new Date().toISOString();
      const combined = `${userId}:${nftHash}:${ts}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating certificate hash:', error);
      throw new Error('Failed to generate certificate hash');
    }
  },
};

// Blockchain API endpoints
export const blockchainAPI = {
  /**
   * Checkpoint A: Record Proof of Originality
   * @param {number} assetId - The asset ID
   * @param {string} documentHash - The SHA-256 hash of the document
   * @returns {Promise<Object>} - Response with proof confirmation
   */
  recordProofOfOriginality: async (assetId, documentHash) => {
    return await blockchainApiCall('/api/blockchain/checkpoint-a/proof-of-originality', {
      method: 'POST',
      body: JSON.stringify({
        asset_id: assetId,
        document_hash: documentHash,
      }),
    });
  },

  /**
   * Checkpoint B: Certify Asset & Mint NFT
   * @param {number} assetId - The asset ID
   * @param {string} nftHash - The NFT hash
   * @param {string} certificateHash - The certificate hash
   * @returns {Promise<Object>} - Response with transaction details
   */
  certifyAsset: async (assetId, nftHash, certificateHash) => {
    return await blockchainApiCall('/api/blockchain/checkpoint-b/certify', {
      method: 'POST',
      body: JSON.stringify({
        asset_id: assetId,
        nft_hash: nftHash,
        certificate_hash: certificateHash,
      }),
    });
  },

  /**
   * Get Transaction Status
   * @param {number} transactionId - The transaction ID
   * @returns {Promise<Object>} - Transaction details with status
   */
  getTransactionStatus: async (transactionId) => {
    return await blockchainApiCall(
      `/api/blockchain/transaction/${transactionId}/status`,
      { method: 'GET' }
    );
  },

  /**
   * Retry Failed Transaction
   * @param {number} transactionId - The transaction ID to retry
   * @returns {Promise<Object>} - Updated transaction details
   */
  retryTransaction: async (transactionId) => {
    return await blockchainApiCall(
      `/api/blockchain/transaction/${transactionId}/retry`,
      { method: 'POST' }
    );
  },

  /**
   * Get All Asset Transactions
   * @param {number} assetId - The asset ID
   * @returns {Promise<Object>} - List of all transactions for the asset
   */
  getAssetTransactions: async (assetId) => {
    return await blockchainApiCall(
      `/api/blockchain/asset/${assetId}/transactions`,
      { method: 'GET' }
    );
  },
};

// Utility functions for UI
export const blockchainUtils = {
  /**
   * Format transaction signature for display
   * @param {string} signature - Full transaction signature
   * @returns {string} - Formatted signature (first 16 + ... + last 16)
   */
  formatSignature: (signature) => {
    if (!signature || signature.length <= 32) return signature;
    return `${signature.substring(0, 16)}...${signature.substring(signature.length - 16)}`;
  },

  /**
   * Get Solana Explorer URL for transaction
   * @param {string} signature - Transaction signature
   * @param {string} cluster - Solana cluster (devnet, testnet, mainnet-beta)
   * @returns {string} - Solana Explorer URL
   */
  getSolanaExplorerUrl: (signature, cluster = 'devnet') => {
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Success status
   */
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  },

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  },

  /**
   * Get status color
   * @param {string} status - Transaction status (pending, confirmed, failed)
   * @returns {string} - Color value
   */
  getStatusColor: (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'pending':
        return '#FFA500'; // Orange
      case 'failed':
        return '#F44336'; // Red
      default:
        return '#999999'; // Gray
    }
  },

  /**
   * Get status icon
   * @param {string} status - Transaction status
   * @returns {string} - Icon representation
   */
  getStatusIcon: (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  },
};
