import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI, assetsAPI } from "../services/api";
import { computeAllHashes, saveCertification } from "../services/encryptionService";

export default function AssetCertification() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  // State
  const [asset, setAsset] = useState(null);
  const [user, setUser] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // On page load: fetch asset & user data
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

        // Fetch asset details (includes user_id)
        const assetData = await assetsAPI.getAssetInfo(assetId);
        setAsset(assetData);

        // Fetch current user for owner name display
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
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

  // Generate hashes
  const handleGenerateHashes = async () => {
    if (!asset) {
      setError("Asset data not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use asset_id from asset response
      const assetId = asset.asset_id;
      // Use user_id from asset response, fallback to current user's id
      let userId = asset.user_id;
      if (!userId && user) {
        userId = user.id;
      }

      if (!assetId || !userId) {
        throw new Error(`Invalid asset (${assetId}) or user (${userId}) ID. The backend may need to include user_id in the asset response.`);
      }

      console.log("Generating hashes with:", { assetId, userId, title: asset.asset_title });
      
      const result = await computeAllHashes(assetId, userId, asset.asset_title);
      setHashes(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate hashes";
      setError(errorMessage);
      console.error("Error generating hashes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save hashes to database
  const handleSaveHashes = async () => {
    if (!hashes || !asset) {
      setError("Hash or asset data not available");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Get user_id from asset (owner of the asset)
      const userId = asset.user_id;
      const nftId = asset.nft_info_id || asset.nft_id;
      
      if (!userId) {
        throw new Error("User ID not found in asset data");
      }

      if (!nftId) {
        throw new Error("NFT ID not found. Please ensure the asset has been registered as NFT first.");
      }

      console.log("Saving certification with:", { userId, nftId });

      const certificationData = {
        user_id: userId,
        nft_id: nftId,
        ownership_hash: hashes.ownership.ownership_hash,
        nft_hash: hashes.nft.nft_hash,
        certificate_hash: hashes.certificate.certificate_hash,
      };

      console.log("Certification data being saved:", certificationData);

      const savedCertification = await saveCertification(certificationData);
      
      console.log("Certification saved successfully:", savedCertification);

      // Navigate to confirmation page with certification ID
      navigate(`/assets/${asset.asset_id || asset.id}/confirmation`, { 
        state: { certificationId: savedCertification.id } 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save certification";
      setError(errorMessage);
      console.error("Error saving certification:", err);
    } finally {
      setSaving(false);
    }
  };

  // Render loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-blue-600 font-semibold">Loading certification page...</p>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Certify Asset</h1>
          <p className="text-gray-600">Generate and save cryptographic hashes for your asset certification</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-semibold">Error</p>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Asset Details Card */}
        {asset && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Asset Title</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{asset.asset_title}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Owner</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{user ? `${user.first_name} ${user.last_name}` : "Loading..."}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Asset ID</p>
                <p className="text-sm font-mono text-gray-700 mt-1">{asset.asset_id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-wide">Owner ID</p>
                <p className="text-sm font-mono text-gray-700 mt-1">{asset.user_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Hashes Section */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Generate Hashes</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to compute the cryptographic hashes for this asset. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li><span className="font-semibold">Ownership Hash:</span> Computed from asset and owner ID</li>
            <li><span className="font-semibold">NFT Hash:</span> Computed from asset and title</li>
            <li><span className="font-semibold">Certificate Hash:</span> Computed from the above two hashes</li>
          </ul>

          <button
            onClick={handleGenerateHashes}
            disabled={loading || !asset}
            className={`${
              loading || !asset
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 transition"
            } text-white px-6 py-3 rounded-lg font-semibold`}
          >
            {loading ? "Generating Hashes..." : "Generate Hashes"}
          </button>
        </div>

        {/* Display Hashes Section */}
        {hashes && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Step 2: Review Generated Hashes</h2>
            
            <div className="space-y-6">
              {/* Ownership Hash */}
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Ownership Hash</p>
                <div className="bg-gray-50 p-3 rounded mt-2 break-words">
                  <code className="text-xs text-gray-700 font-mono">{hashes.ownership.ownership_hash}</code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generated: {new Date(hashes.ownership.timestamp).toLocaleString()}
                </p>
              </div>

              {/* NFT Hash */}
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">NFT Hash</p>
                <div className="bg-gray-50 p-3 rounded mt-2 break-words">
                  <code className="text-xs text-gray-700 font-mono">{hashes.nft.nft_hash}</code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generated: {new Date(hashes.nft.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Certificate Hash */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Certificate Hash</p>
                <div className="bg-gray-50 p-3 rounded mt-2 break-words">
                  <code className="text-xs text-gray-700 font-mono">{hashes.certificate.certificate_hash}</code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generated: {new Date(hashes.certificate.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveHashes}
              disabled={saving}
              className={`${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 transition"
              } text-white px-6 py-3 rounded-lg font-semibold mt-6 w-full`}
            >
              {saving ? "Saving Certification..." : "Save Hashes to Database"}
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/assets/${assetId}`)}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            ← Back to Asset
          </button>
        </div>
      </div>
    </div>
  );
}
