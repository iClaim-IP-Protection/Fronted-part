import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsAPI } from '../services/api';
import CertificateDisplay from '../components/CertificateDisplay';
import Navbar from '../components/Navbar';

export default function CertificateLookup() {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState('');
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      setError('Please enter a Certificate ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAsset(null);

      // Fetch asset details using the certificate ID
      const assetData = await assetsAPI.getAssetByHash(certificateId);

      // Check if asset is certified
      if (!assetData.is_certified) {
        setError('This asset has not been certified yet');
        setSearched(true);
        setLoading(false);
        return;
      }

      setAsset(assetData);
      setSearched(true);
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError(err.message || 'Certificate not found. Please check the ID and try again.');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/home')}
              className="text-blue-600 hover:text-blue-800 font-semibold mb-4 flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">
              Lookup Intellectual Property
            </h1>
            <p className="text-gray-600">
              Search for a Certificate ID to view its authenticity details
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Certificate ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Enter Certificate ID (e.g., asset_12345)"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && searched && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
              <p className="text-red-700 text-lg font-semibold">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Searching for certificate...</p>
              </div>
            </div>
          )}

          {/* Certificate Display */}
          {asset && !error && (
            <>
              {/* <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Certificate Details</h2>
                <CertificateDisplay
                  assetName={asset.asset_title}
                  ownerName={asset.user_username}
                  certificationDate={asset.certification_date_certified}
                  transactionHash={asset.certification_transaction?.transaction_signature}
                  certificateHash={asset.certificate_hash}
                  message={asset.asset_title}
                />
              </div> */}

              {/* Asset Information */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Asset Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Asset ID
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.asset_id}</p>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Asset Title
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.asset_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Version
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.asset_version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Created Date
                    </p>
                    <p className="text-lg text-gray-800 mt-2">
                      {new Date(asset.asset_date_created).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Document Hash
                    </p>
                    <p className="text-sm text-gray-700 mt-2 break-all font-mono bg-gray-50 p-2 rounded">
                      {asset.asset_document_hash}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      IPFS Hash
                    </p>
                    <p className="text-sm text-gray-700 mt-2 break-all font-mono bg-gray-50 p-2 rounded">
                      {asset.ipfs_hash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner/User Information */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Owner Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Username
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.user_username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Email
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.user_email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Wallet Address
                    </p>
                    <p className="text-sm text-gray-700 mt-2 break-all font-mono bg-gray-50 p-2 rounded">
                      {asset.user_wallet_address}
                    </p>
                  </div>
                </div>
              </div>

              {/* NFT Information */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">NFT Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      NFT ID
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.nft_id}</p>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      NFT Hash
                    </p>
                    <p className="text-sm text-gray-700 mt-2 break-all font-mono bg-gray-50 p-2 rounded">
                      {asset.nft_hash}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      NFT Created
                    </p>
                    <p className="text-lg text-gray-800 mt-2">
                      {new Date(asset.nft_date_created).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Information */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Certificate Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Certification ID
                    </p>
                    <p className="text-lg text-gray-800 mt-2">{asset.certification_id}</p>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Status
                    </p>
                    <p className="text-lg text-green-600 font-bold mt-2">
                      {asset.is_certified ? 'CERTIFIED' : 'NOT CERTIFIED'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Certificate Hash
                    </p>
                    <p className="text-sm text-gray-700 mt-2 break-all font-mono bg-gray-50 p-2 rounded">
                      {asset.certificate_hash}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Certified Date
                    </p>
                    <p className="text-lg text-gray-800 mt-2">
                      {new Date(asset.certification_date_certified).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certification Transaction */}
              {asset.certification_transaction && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Certification Transaction</h2>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Transaction ID
                          </p>
                          <p className="text-gray-800 mt-1">{asset.certification_transaction.transaction_id}</p>
                        </div> */}
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Type
                          </p>
                          <p className="text-gray-800 mt-1">{asset.certification_transaction.transaction_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Status
                          </p>
                          <p className="text-green-600 font-bold mt-1">{asset.certification_transaction.status.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Block Number
                          </p>
                          <p className="text-gray-800 mt-1">{asset.certification_transaction.block_number}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Signature
                          </p>
                          <p className="text-sm text-gray-700 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                            {asset.certification_transaction.transaction_signature}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Created
                          </p>
                          <p className="text-gray-800 mt-1">
                            {new Date(asset.certification_transaction.date_created).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Confirmed
                          </p>
                          <p className="text-gray-800 mt-1">
                            {new Date(asset.certification_transaction.date_confirmed).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NFT Transaction */}
              {asset.nft_transaction && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">NFT Mint Transaction</h2>
                  <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Transaction ID
                          </p>
                          <p className="text-gray-800 mt-1">{asset.nft_transaction.transaction_id}</p>
                        </div> */}
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Type
                          </p>
                          <p className="text-gray-800 mt-1">{asset.nft_transaction.transaction_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Status
                          </p>
                          <p className="text-green-600 font-bold mt-1">{asset.nft_transaction.status.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Block Number
                          </p>
                          <p className="text-gray-800 mt-1">{asset.nft_transaction.block_number}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Signature
                          </p>
                          <p className="text-sm text-gray-700 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                            {asset.nft_transaction.transaction_signature}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Created
                          </p>
                          <p className="text-gray-800 mt-1">
                            {new Date(asset.nft_transaction.date_created).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                            Confirmed
                          </p>
                          <p className="text-gray-800 mt-1">
                            {new Date(asset.nft_transaction.date_confirmed).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!asset && !error && searched && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No results found. Please try another Certificate ID.</p>
            </div>
          )}

          {/* Initial State */}
          {!searched && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 text-center">
              <div className="text-blue-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Ready to Search</h3>
              <p className="text-blue-700">
                Enter a Certificate ID above to verify and view the intellectual property details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
