import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, profileAPI, assetsAPI } from "../services/api";

/**
 * RegisterIP Component - Asset Registration Flow
 * 
 * API Endpoint: POST /api/ipfs/upload
 * Request: file, title, version, previous_asset_id (optional)
 * Response: asset_id, title, version, previous_asset_id, ipfs_hash, file_name, user_id, message
 * 
 * Flow:
 * 1. Upload & Encrypt File → Manual Submit to backend
 * 2. Add Title & Version
 * 3. Click Submit Asset button
 * 4. Show success with asset details
 * 
 * Security:
 * - Original file stored locally for viewing
 * - Encrypted file sent to backend for IPFS storage
 * - Backend handles encryption and returns asset details
 */

function RegisterIP() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [previousAssetId, setPreviousAssetId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Asset response data
  const [assetResponse, setAssetResponse] = useState(null);
  
  // Owner info from API
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(true);

  // Encryption key management
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Generate static encryption key from passphrase on component mount
  useEffect(() => {
    const generateStaticKey = async () => {
      try {
        // Static passphrase for deterministic key generation
        const passphrase = "iClaim-Asset-Encryption-V1";
        const encoder = new TextEncoder();
        const passphraseData = encoder.encode(passphrase);

        // Derive base key from passphrase
        const baseKey = await crypto.subtle.importKey(
          "raw",
          passphraseData,
          { name: "PBKDF2" },
          false,
          ["deriveKey"]
        );

        // Derive AES-256 key using PBKDF2
        const derivedKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: new Uint8Array(16), // Static salt for deterministic key
            iterations: 100000,
            hash: "SHA-256",
          },
          baseKey,
          { name: "AES-GCM", length: 256 },
          true, // extractable
          ["encrypt", "decrypt"]
        );

        setEncryptionKey(derivedKey);
        console.log("Static encryption key derived");
      } catch (err) {
        console.error("Error generating encryption key:", err);
        setError("Failed to initialize encryption");
      }
    };
    generateStaticKey();
  }, []);

  // Helper: Encrypt data with AES-256-GCM using deterministic IV from content hash
  const encryptData = async (data, key) => {
    if (!key) throw new Error("Encryption key not available");

    // Derive deterministic IV from file content hash
    const fileHash = await crypto.subtle.digest("SHA-256", data);
    const iv = new Uint8Array(fileHash.slice(0, 12)); // First 96 bits for GCM IV

    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    // Return IV + encrypted data (IV is public, safe to store together)
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);

    return result;
  };

  // Helper: Decrypt data with AES-256-GCM
  const decryptData = async (encryptedData, key) => {
    if (!key) throw new Error("Encryption key not available");

    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new Uint8Array(decryptedData);
  };

  // Helper: Convert Uint8Array to Base64 (for localStorage)
  const uint8ArrayToBase64 = (uint8Array) => {
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Helper: Convert Base64 to Uint8Array
  const base64ToUint8Array = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Retrieve and decrypt PDF from localStorage
  const retrieveDecryptedPDF = async () => {
    try {
      const encryptedBase64 = localStorage.getItem("originalPDF");
      if (!encryptedBase64) {
        throw new Error("No PDF found in localStorage");
      }

      const pdfUint8Array = base64ToUint8Array(encryptedBase64);
      return new Blob([pdfUint8Array], { type: "application/pdf" });
    } catch (err) {
      console.error("Error retrieving PDF:", err);
      return null;
    }
  };

  // Fetch owner information on component mount
  useEffect(() => {
    const fetchOwnerInfo = async () => {
      try {
        const userInfo = await authAPI.getCurrentUser();
        if (userInfo && userInfo.username) {
          const profileData = await profileAPI.getProfile(userInfo.username);
          setOwner({
            name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),
            username: userInfo.username,
          });
        }
      } catch (err) {
        setError("Failed to load owner information: " + err.message);
        console.error("Error fetching owner info:", err);
      } finally {
        setOwnerLoading(false);
      }
    };

    fetchOwnerInfo();
  }, []);

  const handleAssetSubmission = async () => {
    if (!file || !title || !version || !encryptionKey) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
  
    try {
      // 1. Read the file as ArrayBuffer
      const fileArrayBuffer = await file.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileArrayBuffer);

      // 2. Store original file in localStorage for viewing
      const fileBase64 = uint8ArrayToBase64(fileUint8Array);
      localStorage.setItem("originalFile", fileBase64);
      localStorage.setItem("fileName", file.name);
      localStorage.setItem("fileUploadDate", new Date().toISOString());
      console.log("Original file stored in localStorage");

      // 3. Encrypt the file with AES-256-GCM
      const encryptedBytes = await encryptData(fileUint8Array, encryptionKey);
      console.log("File encrypted with AES-256-GCM");

      // 4. Convert encrypted bytes to Base64 for transmission
      const encryptedBase64 = uint8ArrayToBase64(encryptedBytes);

      // 5. Create Blob from encrypted data
      const encryptedBlob = new Blob([encryptedBase64], { type: "text/plain" });

      // 6. Prepare FormData with asset metadata
      const formData = new FormData();
      formData.append("file", encryptedBlob, file.name);
      formData.append("title", title);
      formData.append("version", String(version));
      if (previousAssetId) {
        formData.append("previous_asset_id", String(previousAssetId));
      }

      // 7. Submit to backend API
      setUploadProgress(50);
      const data = await assetsAPI.uploadAsset(formData);
      setAssetResponse(data);
      setUploadProgress(100);
      console.log("Asset registered successfully", data);
      setShowPopup(true);

      // Redirect after success
      setTimeout(() => {
        setShowPopup(false);
        navigate("/my-assets");
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register asset";
      setError(errorMessage);
      console.error("Asset submission error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-6">

        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Register New Asset
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded mb-6 shadow">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

       {/* Step 1: Upload File */}
<div className={`mb-6 p-6 border rounded-xl shadow-sm transition ${file ? 'bg-green-50 border-green-300' : 'bg-blue-50'}`}>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-blue-600">Step 1: Upload Asset File</h2>
    {file && <span className="text-green-600 font-bold">Complete</span>}
  </div>

  {!file ? (
    <>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition mb-4">
        <span className="text-blue-400 mb-2">Drag & Drop your file here</span>
        <span className="text-gray-500 mb-2">or click to select a file</span>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={loading}
          className="hidden"
        />
      </label>
    </>
  ) : (
    <div className="bg-green-100 p-4 rounded-lg border border-green-300">
      <p className="text-green-800 font-semibold mb-2">File selected</p>
      <p className="text-gray-700">Name: <span className="font-medium">{file.name}</span></p>
    </div>
  )}
</div>

        {/* Step 2: Asset Details */}
        <div className={`mb-6 p-6 border rounded-xl shadow-sm transition ${title && version ? 'bg-green-50 border-green-300' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Step 2: Asset Details</h2>
            {title && version && <span className="text-green-600 font-bold">Complete</span>}
          </div>
          <input
            type="text"
            placeholder="Asset Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!file || loading}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            placeholder="Version Number * (e.g., 1)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={!file || loading}
            min="1"
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            placeholder="Previous Asset ID (optional)"
            value={previousAssetId}
            onChange={(e) => setPreviousAssetId(e.target.value)}
            disabled={!file || loading}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {loading && (
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          <p className="text-gray-500 text-sm mt-3">* Required fields</p>
        </div>

        {/* Step 3: Owner Info */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">Step 3: Your Information</h2>
          {ownerLoading ? (
            <p className="text-gray-500 animate-pulse">Loading your information...</p>
          ) : owner ? (
            <div className="space-y-2">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{owner.name || "N/A"}</span></p>
              <p><span className="text-gray-600">Username:</span> <span className="font-medium">{owner.username}</span></p>
            </div>
          ) : (
            <p className="text-red-600">Failed to load your information</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={handleAssetSubmission}
            disabled={loading || ownerLoading || !file || !title || !version}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? `Submitting... ${uploadProgress}%` : "Submit Asset"}
          </button>
          <button
            onClick={() => navigate("/my-assets")}
            disabled={loading}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition shadow-lg disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

      </div>

      {/* Success Popup */}
      {showPopup && assetResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-green-600 mb-3">Asset Registered!</h2>
            <div className="bg-green-50 p-4 rounded-lg mb-4 text-left space-y-2">
              <p><span className="text-gray-600">Asset ID:</span> <span className="font-semibold">{assetResponse.asset_id}</span></p>
              <p><span className="text-gray-600">Title:</span> <span className="font-semibold">{assetResponse.title}</span></p>
              <p><span className="text-gray-600">Version:</span> <span className="font-semibold">{assetResponse.version}</span></p>
              <p><span className="text-gray-600">IPFS Hash:</span> <span className="font-mono text-xs break-all">{assetResponse.ipfs_hash}</span></p>
            </div>
            <p className="text-gray-600 text-sm mb-4">{assetResponse.message}</p>
            <p className="text-gray-500 text-xs mb-4">Redirecting to assets...</p>
            <button
              onClick={() => navigate("/my-assets")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              View Assets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterIP;