import React from 'react';
import { formatHashForDisplay } from '../utils/certificateUtils';

export default function CertificateDisplay({ 
  assetName, 
  ownerName, 
  certificationDate, 
  transactionHash, 
  certificateHash,
  message 
}) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Certificate Container */}
      <div className="bg-gradient-to-br from-blue-50 to-white border-4 border-blue-600 rounded-lg shadow-2xl p-12 min-h-96">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-blue-400 pb-6">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            CERTIFICATE OF AUTHENTICITY
          </h1>
          <p className="text-gray-600 italic text-lg">
            Blockchain-Verified Asset Certificate
          </p>
        </div>

        {/* Certificate Content */}
        <div className="space-y-6 mb-8">
          {/* Asset Name */}
          <div className="flex justify-between items-start">
            <label className="font-bold text-blue-600 text-lg">Asset Name:</label>
            <span className="text-gray-700 text-lg font-semibold max-w-xs text-right">
              {assetName || 'N/A'}
            </span>
          </div>

          {/* Owner Name */}
          <div className="flex justify-between items-start">
            <label className="font-bold text-blue-600 text-lg">Owner Name:</label>
            <span className="text-gray-700 text-lg font-semibold max-w-xs text-right">
              {ownerName || 'N/A'}
            </span>
          </div>

          {/* Certification Date */}
          <div className="flex justify-between items-start">
            <label className="font-bold text-blue-600 text-lg">Certification Date:</label>
            <span className="text-gray-700 text-lg font-semibold">
              {certificationDate ? new Date(certificationDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          {/* Transaction Hash */}
          <div className="flex justify-between items-start">
            <label className="font-bold text-blue-600 text-lg">Transaction Hash:</label>
            <div className="max-w-xs text-right">
              <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded block break-all">
                {transactionHash || 'N/A'}
              </code>
            </div>
          </div>

          {/* Certificate Hash */}
          <div className="flex justify-between items-start">
            <label className="font-bold text-blue-600 text-lg">Certificate Hash:</label>
            <div className="max-w-xs text-right">
              <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded block break-all">
                {certificateHash || 'N/A'}
              </code>
            </div>
          </div>

          {/* Message/Description if provided */}
          {message && (
            <div className="flex justify-between items-start">
              <label className="font-bold text-blue-600 text-lg">Description:</label>
              <span className="text-gray-700 max-w-xs text-right">
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-blue-400 pt-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Generated on {new Date().toLocaleString()}
          </p>
          <p className="text-green-600 font-bold text-lg">
            ✓ Blockchain Verified
          </p>
        </div>
      </div>
    </div>
  );
}
