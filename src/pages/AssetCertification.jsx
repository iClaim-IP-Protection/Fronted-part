import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI, assetsAPI } from "../services/api";
import CertifyAssetForm from "../components/CertifyAssetForm";

export default function AssetCertification() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  // State
  const [asset, setAsset] = useState(null);
  const [certifyStarted, setCertifyStarted] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // On page load: fetch asset data
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        setError(null);

        // Check authentication
        if (!authAPI.isAuthenticated()) {
          navigate("/login");
          return;
        }

        // Fetch asset details (includes document_hash from backend)
        const assetData = await assetsAPI.getAssetInfo(assetId);
        setAsset(assetData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load asset";
        setError(errorMessage);
        console.error("Error loading certification page:", err);
        
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => navigate("/login"), 1000);
        }
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [assetId, navigate]);

  // Handle errors from blockchain components
  const handleBlockchainError = (errorMsg) => {
    setError(errorMsg);
    console.error("Blockchain error:", errorMsg);
  };

  // Handle certification success
  const handleCertifySuccess = (data) => {
    setCertifyStarted(true);
    setError(null);
    console.log("Asset certified successfully!", data);
    // Optionally: navigate("/my-assets", { state: { message: "Certification successful!" } });
  };

  // Render loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-blue-600 font-semibold">Loading asset details...</p>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/assets/`)}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            ← Back to My Assets
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Certify Your Asset</h1>
          <p className="text-gray-600 text-lg">
            Mint NFT and Certificate on the Solana blockchain for your intellectual property
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-semibold">⚠️ Error</p>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Asset Info Card */}
        {asset && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Asset Title</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{asset.asset_title}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Asset ID</p>
                <p className="text-lg font-mono text-gray-700 mt-2">{assetId}</p>
              </div>
              {asset.document_hash && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wide">Document Hash</p>
                  <p className="text-sm font-mono text-gray-700 mt-2 break-all">{asset.document_hash}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Asset Not Found */}
        {!asset && !error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded mb-8">
            <p className="text-yellow-700 font-semibold">⚠️ Asset Not Found</p>
            <p className="text-yellow-600 mt-2">The asset you're trying to certify could not be found.</p>
            <button
              onClick={() => navigate("/my-assets")}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Return to My Assets
            </button>
          </div>
        )}

        {/* No Document Hash Warning */}
        {asset && !asset.document_hash && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded mb-8">
            <p className="text-orange-700 font-semibold">⚠️ Document Not Uploaded</p>
            <p className="text-orange-600 mt-2">
              This asset has not been registered with a document. Please return to My Assets and upload a document first.
            </p>
            <button
              onClick={() => navigate("/my-assets")}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Return to My Assets
            </button>
          </div>
        )}

        {/* Certification Form */}
        {asset && asset.document_hash && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                1
              </span>
              Mint NFT & Certificate
            </h2>
            <CertifyAssetForm
              asset={asset}
              onSuccess={handleCertifySuccess}
              onError={handleBlockchainError}
            />
          </div>
        )}

        {/* Progress Indicator */}
        {asset && asset.document_hash && (
          <div className="bg-white rounded-xl shadow p-6 mt-8">
            <h3 className="font-semibold text-gray-800 mb-4">Certification Progress</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 bg-green-600">
                  ✓
                </div>
                <p className="text-sm text-gray-600">Asset Registered</p>
              </div>
              <div className="flex-1 h-1 mx-2 bg-green-600"></div>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${certifyStarted ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {certifyStarted ? '✓' : '2'}
                </div>
                <p className="text-sm text-gray-600">Minting Transactions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
