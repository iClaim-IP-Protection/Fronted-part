import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetsAPI, authAPI } from '../services/api';
import { blockchainAPI } from '../services/blockchainService';
import CertificateDisplay from '../components/CertificateDisplay';
import { generateCertificatePDF, downloadCertificatePDF, generateCertificateHash } from '../utils/certificateUtils';

export default function CertificationDetails() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificateHash, setCertificateHash] = useState(null);

  useEffect(() => {
    fetchCertificationData();
  }, [assetId]);

  const fetchCertificationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      if (!authAPI.isAuthenticated()) {
        navigate('/login');
        return;
      }

      // Fetch asset details
      const assetData = await assetsAPI.getAssetInfo(assetId);
      if (!assetData.certified && !assetData.is_certified) {
        setError('This asset has not been certified yet');
        setLoading(false);
        return;
      }

      setAsset(assetData);

      // Fetch user info
      const user = await authAPI.getCurrentUser();
      setUserInfo(user);

      // Fetch blockchain transactions
      try {
        const txData = await blockchainAPI.getAssetTransactions(assetId);
        setTransactions(txData);
      } catch (txError) {
        console.warn('Could not fetch transaction history:', txError);
        // Continue without transaction history
      }

      // Generate certificate hash (NFT ID + User + Timestamp)
      // Using the asset certification date as timestamp
      if (user && user.id) {
        const hash = generateCertificateHash(
          assetId,
          user.username || user.email,
          assetData.date_certified || assetData.date_created
        );
        setCertificateHash(hash);
      }
    } catch (err) {
      console.error('Error fetching certification data:', err);
      if (err.message?.includes('401')) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to load certification details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    try {
      if (!asset || !userInfo) {
        alert('Missing required data for certificate generation');
        return;
      }

      const certificateData = {
        assetName: asset.title || 'N/A',
        ownerName: userInfo.first_name && userInfo.last_name 
          ? `${userInfo.first_name} ${userInfo.last_name}`
          : userInfo.username || userInfo.email,
        certificationDate: asset.date_certified || asset.date_created,
        transactionHash: transactions?.transactions?.[0]?.signature || 'N/A',
        certificateHash: certificateHash || 'N/A',
        message: asset.description || '',
      };

      const pdf = generateCertificatePDF(certificateData);
      const filename = `certificate-${asset.asset_id || assetId}-${new Date().getTime()}.pdf`;
      downloadCertificatePDF(pdf, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate certificate PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <p className="text-xl text-blue-600">Loading certification details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-xl text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={() => navigate('/assets')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/assets')}
            className="text-blue-600 hover:text-blue-800 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back to Assets
          </button>
          <h1 className="text-3xl font-bold text-blue-600">Certificate Details</h1>
          <p className="text-gray-600 mt-2">Asset: {asset?.title}</p>
        </div>

        {/* Certificate Display */}
        <div className="mb-8">
          <CertificateDisplay
            assetName={asset?.title}
            ownerName={
              userInfo?.first_name && userInfo?.last_name
                ? `${userInfo.first_name} ${userInfo.last_name}`
                : userInfo?.username || userInfo?.email
            }
            certificationDate={asset?.date_certified || asset?.date_created}
            transactionHash={transactions?.transactions?.[0]?.signature}
            certificateHash={certificateHash}
            message={asset?.description}
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadCertificate}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-semibold flex items-center justify-center gap-2"
            >
              📥 Download as PDF
            </button>
            <button
              onClick={() => navigate(`/assets/${assetId}`)}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2"
            >
              ℹ️ View Asset Details
            </button>
          </div>
        </div>

        {/* Transaction Information */}
        {transactions?.transactions && transactions.transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction Information</h2>
            <div className="space-y-4">
              {transactions.transactions.slice(0, 3).map((tx, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Status:</span> {tx.status || 'Unknown'}
                  </p>
                  {tx.signature && (
                    <p className="text-sm text-gray-600 break-all">
                      <span className="font-semibold">Signature:</span> {tx.signature}
                    </p>
                  )}
                  {tx.timestamp && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Date:</span> {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
