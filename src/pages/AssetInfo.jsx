import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assetsAPI, authAPI } from "../services/api";

export default function AssetInfo() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

      // Try to load file from localStorage (stored during registration)
      const storedFile = localStorage.getItem(`asset_file_${assetId}`);
      if (storedFile) {
        // Parse the stored JSON (contains type and data)
        const fileObj = JSON.parse(storedFile);
        setFileData(fileObj);
      }
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

  const handleViewFile = () => {
    if (!fileData) {
      alert("File data not available");
      return;
    }

    try {
      // Convert base64 back to blob
      const byteCharacters = atob(fileData.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileData.type });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `asset_${assetId}_${new Date().getTime()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assetsAPI.deleteAsset(assetId);

      // Clear localStorage
      localStorage.removeItem(`asset_file_${assetId}`);

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
    // Navigate to edit page (can be implemented later)
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

            {/* File Data Section */}
            {fileData && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
                <h3 className="text-sm font-semibold text-blue-700 uppercase mb-4">
                  Stored File
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                      File Type
                    </p>
                    <p className="font-semibold text-blue-900">{fileData.type}</p>
                  </div>
                  <button
                    onClick={handleViewFile}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Download File
                  </button>
                </div>
              </div>
            )}

            {!fileData && (
              <div className="bg-gray-100 border border-gray-300 p-6 rounded-lg mb-8 text-center text-gray-600">
                <p>No file data available in local storage</p>
              </div>
            )}
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
