import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assetsAPI, authAPI } from "../services/api";
import { decryptWithProjectKey } from "../utils/aes256gcm";

// IPFS Gateway URL - using public gateway
const IPFS_GATEWAY = "https://ipfs.io/ipfs";
// Alternative gateways:
// const IPFS_GATEWAY = "https://ipfs.io/ipfs";
// const IPFS_GATEWAY = "https://cloudflare-ipfs.com/ipfs";

export default function AssetInfo() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper: Convert Base64 to Uint8Array
  const base64ToUint8Array = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [assetId]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check auth
      const token = authAPI.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch asset details from backend
      const data = await assetsAPI.getAssetInfo(assetId);
      setAsset(data);
    } catch (err) {
      console.error("Error fetching asset details:", err);
      if (err.message?.includes("401")) {
        navigate("/login");
      } else {
        setError(err.message || "Failed to load asset details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!asset || !asset.ipfs_hash) {
      alert("Asset IPFS hash not available");
      return;
    }

    try {
      setFileLoading(true);

      // 1. Fetch encrypted file from IPFS
      const ipfsUrl = `${IPFS_GATEWAY}/${asset.ipfs_hash}`;
      console.log("Fetching from IPFS:", ipfsUrl);

      const response = await fetch(ipfsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.status}`);
      }

      const text = await response.text();
      
      // 2. Convert Base64 to Uint8Array
      const encryptedBytes = base64ToUint8Array(text);
      
      // 3. Decrypt the file (using project's static key)
      const decryptedBytes = decryptWithProjectKey(encryptedBytes);
      
      // 4. Create blob and trigger download
      const blob = new Blob([decryptedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asset.title || "asset"}_v${asset.version || "1"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("File decrypted and downloaded successfully");
    } catch (err) {
      console.error("Error downloading/decrypting file:", err);
      alert("Failed to download file: " + err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assetsAPI.deleteAsset(assetId);

      // Redirect to my-assets
      navigate("/assets");
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert("Failed to delete asset: " + err.message);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-asset/${assetId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading asset details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/my-assets")}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to My Assets
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/my-assets")}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to My Assets
          </button>
          <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-600">
            Asset not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/assets")}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back to My Assets
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{asset.asset_title}</h1>
            <p className="text-blue-100">Asset ID: {asset.asset_id}</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                  Asset Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Version
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {asset.version}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Previous Asset ID
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {asset.previous_asset_id || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Date Created
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(asset.date_created).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Time
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(asset.date_created).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* IPFS Hash Section */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                IPFS Information
              </h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                IPFS Hash
              </p>
              <p className="font-mono text-sm bg-white p-4 rounded border border-gray-200 break-all">
                {asset.ipfs_hash}
              </p>
            </div>

            {/* File Download Section */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
              <h3 className="text-sm font-semibold text-blue-700 uppercase mb-4">
                Original File
              </h3>
              <p className="text-sm text-blue-600 mb-4">
                Download the original file from your current session storage.
              </p>
              <button
                onClick={handleDownloadFile}
                disabled={fileLoading}
                className={`w-full py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                  fileLoading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {fileLoading ? "Downloading..." : "Download File"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleEdit}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Edit Asset
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete Asset
              </button>
            ) : (
              <>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
