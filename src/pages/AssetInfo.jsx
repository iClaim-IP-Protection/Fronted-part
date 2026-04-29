import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assetsAPI, authAPI } from "../services/api";
import { decryptWithProjectKey, encryptWithProjectKey } from "../utils/aes256gcm";
import { generateProtectedIPCertificatePDF, downloadCertificatePDF, generateCertificateHash } from "../utils/certificateUtils";
import { blockchainAPI } from "../services/blockchainService";
import TransactionHistoryView from "../components/TransactionHistoryView";

// IPFS Gateway URL - using local IPFS node
const IPFS_GATEWAY = "http://localhost:8080/ipfs";
// Fallback gateways if local node is unavailable:
// const IPFS_GATEWAY_FALLBACK = "https://ipfs.io/ipfs";
// const IPFS_GATEWAY_CLOUDFLARE = "https://cloudflare-ipfs.com/ipfs";

export default function AssetInfo() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Helper: Convert Base64 to Uint8Array
  const base64ToUint8Array = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Convert Uint8Array to Base64
  const uint8ArrayToBase64 = (uint8Array) => {
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Test encryption/decryption round-trip
  const testEncryptionRoundTrip = async () => {
    try {
      const testData = new TextEncoder().encode("Hello World! This is a test.");
      console.log("=== ENCRYPTION ROUND-TRIP TEST ===");
      console.log("Original data:", testData);
      console.log("Original string:", new TextDecoder().decode(testData));

      // Encrypt
      const encrypted = encryptWithProjectKey(testData);
      console.log("Encrypted bytes length:", encrypted.length);
      console.log("First 20 bytes of encrypted:", Array.from(encrypted.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Convert to Base64 (like in upload)
      const encryptedBase64 = uint8ArrayToBase64(encrypted);
      console.log("Encrypted Base64 length:", encryptedBase64.length);
      console.log("First 100 chars Base64:", encryptedBase64.substring(0, 100));

      // Convert back from Base64 (like in download)
      const encryptedBytesFromBase64 = base64ToUint8Array(encryptedBase64);
      console.log("Decrypted from Base64 length:", encryptedBytesFromBase64.length);

      // Decrypt
      const decrypted = decryptWithProjectKey(encryptedBytesFromBase64);
      console.log("Decrypted bytes length:", decrypted.length);
      console.log("Decrypted string:", new TextDecoder().decode(decrypted));

      if (new TextDecoder().decode(decrypted) === "Hello World! This is a test.") {
        console.log("✅ ROUND-TRIP TEST PASSED!");
        alert("✅ Encryption/Decryption working correctly!");
      } else {
        console.error("❌ ROUND-TRIP TEST FAILED! Decrypted data doesn't match original!");
        alert("❌ Encryption round-trip failed!");
      }
    } catch (err) {
      console.error("Test error:", err);
      alert("Error during round-trip test: " + err.message);
    }
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
      console.log("🔍 Asset object:", data);
      console.log("📋 Certification status - is_certified:", data?.is_certified, "certified:", data?.certified);
      setAsset(data);

      // Fetch current user info
      try {
        const user = await authAPI.getCurrentUser();
        setUserInfo(user);
      } catch (userErr) {
        console.warn('Could not fetch user info:', userErr);
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

      // Try fetching as text (base64) first
      const text = await response.text();
      console.log("IPFS Response received, length:", text.length);
      console.log("First 100 chars of response:", text.substring(0, 100));
      
      if (!text || text.length === 0) {
        throw new Error("IPFS returned empty content");
      }
      
      // 2. Try to decode as base64 first
      let encryptedBytes;
      try {
        encryptedBytes = base64ToUint8Array(text);
        console.log("Decoded from Base64, bytes length:", encryptedBytes.length);
      } catch (e) {
        // If base64 decode fails, maybe it's binary data
        console.log("Base64 decode failed, trying as binary...", e);
        encryptedBytes = new TextEncoder().encode(text);
      }
      
      console.log("Encrypted bytes length:", encryptedBytes.length);
      
      if (encryptedBytes.length === 0) {
        throw new Error("No encrypted data received");
      }
      
      // 3. Decrypt the file (using project's static key)
      const decryptedBytes = decryptWithProjectKey(encryptedBytes);
      console.log("Decrypted bytes length:", decryptedBytes.length);
      
      // Check if decrypted data is a valid PDF
      const pdfHeader = String.fromCharCode(...decryptedBytes.slice(0, 4));
      console.log("First 4 bytes of decrypted file:", pdfHeader);
      console.log("First 20 bytes hex:", Array.from(decryptedBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      if (pdfHeader !== '%PDF') {
        console.error("⚠️ INVALID PDF HEADER! Expected '%PDF', got:", pdfHeader);
        console.error("This suggests the backend may be re-encrypting the data or using a different key.");
        console.error("First 20 bytes should be: 25 50 44 46 ... but got:", Array.from(decryptedBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        console.error("Check backend code - is it re-encrypting or using a different key?");
        alert("PDF decryption failed. Check console for details. Backend may be re-encrypting the data.");
        return;
      }
      
      // 4. Create blob and trigger download
      const blob = new Blob([decryptedBytes], { type: "application/pdf" });
      console.log("Blob size:", blob.size);
      
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

  const handleDownloadProtectedIPCertificate = async () => {
    try {
      console.log("🔐 Certificate button clicked");
      
      setCertificateLoading(true);

      // Fetch transaction data
      let transactionData = null;

      try {
        const txData = await blockchainAPI.getAssetTransactions(assetId);
        console.log("📦 Transaction data:", txData);
        transactionData = txData?.transactions?.[0];
      } catch (txErr) {
        console.warn('Could not fetch transaction data:', txErr);
      }

      // Prepare certificate data (using only available data from frontend/API)
      const submitterName = userInfo?.first_name && userInfo?.last_name 
        ? `${userInfo.first_name} ${userInfo.last_name}`
        : userInfo?.username || userInfo?.email || 'Unknown User';

      // Helper: Format date without time
      const formatDateOnly = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const certificateData = {
        assetTitle: asset.asset_title || asset.title || 'Unknown Asset',
        submitterName: submitterName,
        uploadedDate: formatDateOnly(asset.date_created),
        certifiedDate: formatDateOnly(asset.date_created),
        ipfsHash: asset.ipfs_hash || 'N/A',
        nftHash: transactionData?.nft_hash || 'N/A',
        transactionId: transactionData?.signature || 'N/A',
        blockNumber: transactionData?.block_number || 'N/A',
        walletAddress: userInfo?.wallet_address || userInfo?.solana_wallet || 'N/A',
        certificateId: transactionData?.certificate_hash || 'N/A',
      };

      console.log("📄 Certificate data:", certificateData);

      // Generate PDF
      const pdf = generateProtectedIPCertificatePDF(certificateData);
      const filename = `protected-ip-certificate-${asset.asset_id || assetId}-${new Date().getTime()}.pdf`;
      downloadCertificatePDF(pdf, filename);

      console.log('✅ Protected IP Certificate downloaded successfully');
      alert('✅ Protected IP Certificate downloaded successfully!');
    } catch (err) {
      console.error('Error generating Protected IP Certificate:', err);
      alert('Failed to generate Protected IP Certificate: ' + err.message);
    } finally {
      setCertificateLoading(false);
    }
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
            {/* <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
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

              {/* Test Encryption Button (for debugging) */}
              {/* <button
                onClick={testEncryptionRoundTrip}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                🧪 Test Encryption
              </button>
            </div> */}

            {/* Protected IP Certificate Section */}
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-8">
              <h3 className="text-sm font-semibold text-amber-700 uppercase mb-4">
                📜 Protected IP Certificate
              </h3>
              <p className="text-sm text-amber-600 mb-4">
                Download the certificate of your protected intellectual property with blockchain verification details.
              </p>
              <button
                onClick={handleDownloadProtectedIPCertificate}
                disabled={certificateLoading}
                className={`w-full py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                  certificateLoading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {certificateLoading ? "Generating Certificate..." : "Download Certificate"}
              </button>
            </div>

            {/* Blockchain Transaction History */}
            <TransactionHistoryView assetId={assetId} />
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
