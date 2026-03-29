import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { authAPI, assetsAPI } from "../services/api";
import { getCertification } from "../services/encryptionService";

export default function AssetConfirmation() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [asset, setAsset] = useState(null);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Load asset and certification data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        if (!authAPI.isAuthenticated()) {
          navigate("/login");
          return;
        }

        // Fetch asset details
        const assetData = await assetsAPI.getAssetInfo(assetId);
        setAsset(assetData);

        // Try to fetch certification from location state first, then from API
        if (location.state?.certificationId) {
          const certData = await getCertification(location.state.certificationId);
          setCertification(certData);
        } else {
          // Try to fetch the latest certification for this asset
          // This assumes there's an endpoint or we need to fetch from asset data
          if (assetData.certification) {
            setCertification(assetData.certification);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load confirmation data";
        setError(errorMessage);
        console.error("Error loading confirmation page:", err);
        
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => navigate("/login"), 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assetId, navigate, location.state]);

  // Copy hash to clipboard
  const handleCopyHash = (hashValue, hashType) => {
    navigator.clipboard.writeText(hashValue);
    setCopiedHash(hashType);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Download certificate as text
  const handleDownloadCertificate = () => {
    if (!certification || !asset) {
      alert("Certification data not available");
      return;
    }

    const certificateText = `
ASSET CERTIFICATION CERTIFICATE
================================

Asset Information:
  Title: ${asset.title}
  Asset ID: ${asset.id}
  Certified Date: ${new Date(certification.date_certified || new Date()).toLocaleString()}

Cryptographic Hashes:

Ownership Hash:
${certification.ownership_hash}

NFT Hash:
${certification.nft_hash}

Certificate Hash:
${certification.certificate_hash}

================================
This certificate verifies the cryptographic integrity of the asset.
Each hash is a SHA-256 digest that uniquely identifies the asset data.
    `.trim();

    const blob = new Blob([certificateText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${asset.title}_certification.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-blue-600 font-semibold">Loading certification details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/assets/${assetId}`)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Back to Asset
            </button>
            <button
              onClick={() => navigate("/assets")}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              My Assets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Banner */}
        <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-xl">
          <h1 className="text-3xl font-bold text-green-600 mb-2">✓ Asset Certified Successfully</h1>
          <p className="text-green-700">Your asset has been certified and saved to the database.</p>
        </div>

        {/* Asset Details Card */}
        {asset && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Asset Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Title</p>
                <p className="text-lg font-semibold text-blue-600 mt-1">{asset.title}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Asset ID</p>
                <p className="text-sm font-mono text-gray-700 mt-1">{asset.id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Version</p>
                <p className="text-lg font-semibold text-gray-700 mt-1">{asset.version || "1"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Created Date</p>
                <p className="text-sm text-gray-700 mt-1">
                  {new Date(asset.date_created).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Certification Details Card */}
        {certification && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Certification Details</h2>

            {/* Certification Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 pb-6 border-b">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Certified Date</p>
                <p className="text-sm text-gray-700 mt-1">
                  {new Date(certification.date_certified || new Date()).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Certification ID</p>
                <p className="text-sm font-mono text-gray-700 mt-1">{certification.id}</p>
              </div>
            </div>

            {/* Hashes Display */}
            <h3 className="text-lg font-bold text-gray-800 mb-6">Cryptographic Hashes</h3>
            
            <div className="space-y-6">
              {/* Ownership Hash */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Ownership Hash</p>
                  <button
                    onClick={() => handleCopyHash(certification.ownership_hash, "ownership")}
                    className={`text-xs px-3 py-1 rounded ${
                      copiedHash === "ownership"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition`}
                  >
                    {copiedHash === "ownership" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded break-words">
                  <code className="text-xs text-gray-700 font-mono">{certification.ownership_hash}</code>
                </div>
              </div>

              {/* NFT Hash */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">NFT Hash</p>
                  <button
                    onClick={() => handleCopyHash(certification.nft_hash, "nft")}
                    className={`text-xs px-3 py-1 rounded ${
                      copiedHash === "nft"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition`}
                  >
                    {copiedHash === "nft" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded break-words">
                  <code className="text-xs text-gray-700 font-mono">{certification.nft_hash}</code>
                </div>
              </div>

              {/* Certificate Hash */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Certificate Hash</p>
                  <button
                    onClick={() => handleCopyHash(certification.certificate_hash, "certificate")}
                    className={`text-xs px-3 py-1 rounded ${
                      copiedHash === "certificate"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition`}
                  >
                    {copiedHash === "certificate" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded break-words">
                  <code className="text-xs text-gray-700 font-mono">{certification.certificate_hash}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleDownloadCertificate}
              disabled={!certification}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              📥 Download Certificate
            </button>
            <button
              onClick={() => navigate("/assets")}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              ✓ Back to My Assets
            </button>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/assets")}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            ← Return to Assets List
          </button>
        </div>
      </div>
    </div>
  );
}
