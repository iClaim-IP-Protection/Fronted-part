import React, { useState, useRef } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { hashingUtilities, blockchainUtils } from '../services/blockchainService';
import './UploadDocumentForm.css';

const UploadDocumentForm = ({ assetId, onSuccess, onError }) => {
  const { recordProofOfOriginality } = useBlockchain();
  const [file, setFile] = useState(null);
  const [documentHash, setDocumentHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | generating-hash | recording | confirmed
  const [timestamp, setTimestamp] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      const errorMsg = `File too large. Maximum size is ${sizeMB}MB`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStatus('idle');
    setDocumentHash(null);
  };

  const generateHash = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('generating-hash');

    try {
      const hash = await hashingUtilities.generateDocumentHash(file);
      setDocumentHash(hash);
      setStatus('generated-hash');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate hash';
      setError(errorMsg);
      setStatus('idle');
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordProof = async () => {
    if (!assetId || !documentHash) {
      setError('Missing asset ID or document hash');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('recording');

    try {
      const response = await recordProofOfOriginality(assetId, documentHash);
      setStatus('confirmed');
      setTimestamp(response.timestamp);
      
      if (onSuccess) {
        onSuccess({
          assetId,
          documentHash,
          timestamp: response.timestamp,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record proof of originality';
      setError(errorMsg);
      setStatus('idle');
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = async () => {
    if (documentHash) {
      const success = await blockchainUtils.copyToClipboard(documentHash);
      if (success) {
        // Show temporary success feedback
        const originalStatus = status;
        setStatus('copied');
        setTimeout(() => setStatus(originalStatus), 2000);
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocumentHash(null);
    setError(null);
    setStatus('idle');
    setTimestamp(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-document-form">
      <div className="form-card">
        <h2>Upload Your Document</h2>
        <p className="form-description">
          Upload a document to create a proof of originality on the blockchain
        </p>

        {/* File Input Section */}
        {status !== 'confirmed' && (
          <div className="file-input-section">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={loading}
              className="file-input"
              aria-label="Upload document file"
            />
            <div className="file-display">
              {file ? (
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              ) : (
                <span className="file-placeholder">No file selected</span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Status Messages */}
        {status === 'uploading' && (
          <div className="status-message uploading">
            Uploading document...
          </div>
        )}

        {status === 'generating-hash' && (
          <div className="status-message processing">
            Generating document hash...
          </div>
        )}

        {status === 'recording' && (
          <div className="status-message processing">
            Recording proof of originality...
          </div>
        )}

        {/* Hash Display Section */}
        {documentHash && status !== 'confirmed' && (
          <div className="hash-section">
            <h3>Document Hash (SHA-256)</h3>
            <div className="hash-display">
              <code className="hash-value">{documentHash}</code>
              <button
                className="copy-button"
                onClick={copyHash}
                disabled={loading}
                aria-label="Copy document hash to clipboard"
                title="Copy hash"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Success Section */}
        {status === 'confirmed' && (
          <div className="success-section">
            <div className="success-icon"> </div>
            <h3>Document Uploaded Successfully!</h3>
            
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Document Hash:</span>
                <code className="detail-value">{documentHash}</code>
                <button
                  className="copy-button small"
                  onClick={copyHash}
                  aria-label="Copy document hash"
                  title="Copy hash"
                >
                  Copy
                </button>
              </div>

              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-confirmed">
                  Proof of Originality Recorded
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Timestamp:</span>
                <span className="detail-value">
                  {blockchainUtils.formatDate(timestamp)}
                </span>
              </div>

              <p className="success-message">
                Your document timestamp is now secured on the blockchain. 
                You can proceed to certify your asset.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="button-group">
          {status !== 'confirmed' ? (
            <>
              {!documentHash && (
                <button
                  className="btn btn-primary"
                  onClick={generateHash}
                  disabled={!file || loading}
                  aria-label="Generate document hash"
                >
                  {loading ? 'Generating...' : 'Generate Hash'}
                </button>
              )}

              {documentHash && status !== 'recording' && (
                <button
                  className="btn btn-success"
                  onClick={handleRecordProof}
                  disabled={loading}
                  aria-label="Record proof of originality"
                >
                  {loading ? 'Recording...' : 'Record Proof of Originality'}
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={loading}
                aria-label="Clear and start over"
              >
                Reset
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-success"
                disabled
                aria-label="Document upload complete"
              >
                Upload Complete
              </button>
              <button
                className="btn btn-secondary"
                onClick={resetForm}
                aria-label="Upload another document"
              >
                Upload Another
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentForm;
