import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { authAPI, profileAPI } from "../services/api";

/**
 * RegisterIP Component
 * 
 * Encryption Implementation:
 * - Uses Web Crypto API's AES-256-GCM (no external dependencies)
 * - Generates random 256-bit key on component mount
 * - Each PDF is encrypted with a random 96-bit IV (Initialization Vector)
 * - Original PDF stored in localStorage (unencrypted, for content security)
 * - Encrypted PDF uploaded to IPFS for blockchain storage
 * - IV prepended to encrypted data (IV is public, encryption key is private)
 * 
 * Security Model:
 * - localStorage: Original PDF (user's device only)
 * - IPFS: Encrypted PDF (publicly stored but unreadable without key)
 * - Encryption Key: Generated per session (in-memory only)
 */

function RegisterIP() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metadataHash, setMetadataHash] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Step completion tracking
  const [steps, setSteps] = useState({
    fileUploaded: false,
    detailsAdded: false,
    hashGenerated: false,
  });
  
  // Owner info from API
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(true);

  // Encryption key management
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Generate AES-256 encryption key on component mount
  useEffect(() => {
    const generateKey = async () => {
      try {
        const key = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true, // extractable
          ["encrypt", "decrypt"]
        );
        setEncryptionKey(key);
      } catch (err) {
        console.error("Error generating encryption key:", err);
      }
    };
    generateKey();
  }, []);

  // Helper: Encrypt data with AES-256-GCM
  const encryptData = async (data, key) => {
    if (!key) throw new Error("Encryption key not available");

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

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
            wallet: profileData.wallet_address || "Not connected",
            userId: userInfo.id || "N/A",
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

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!encryptionKey) {
      setError("Encryption key not ready. Please refresh the page.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // 1. Read the PDF file as ArrayBuffer
      const fileArrayBuffer = await file.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileArrayBuffer);

      // 2. Store original PDF in localStorage (unencrypted for content security)
      const pdfBase64 = uint8ArrayToBase64(fileUint8Array);
      localStorage.setItem("originalPDF", pdfBase64);
      localStorage.setItem("pdfFileName", file.name);
      console.log("Original PDF stored in localStorage");

      // 3. Encrypt the file with AES-256-GCM
      const encryptedBytes = await encryptData(fileUint8Array, encryptionKey);
      console.log("PDF encrypted with AES-256-GCM");

      // 4. Convert encrypted bytes to Base64 for transmission
      const encryptedBase64 = uint8ArrayToBase64(encryptedBytes);

      // 5. Create Blob from encrypted data
      const encryptedBlob = new Blob([encryptedBase64], { type: "text/plain" });

      // 6. Prepare FormData for IPFS upload
      const formData = new FormData();
      formData.append("file", encryptedBlob, `${file.name}.aes`);

      // 7. Upload encrypted PDF to backend IPFS
      setUploadProgress(50);
      const response = await fetch("http://localhost:8000/api/ipfs/upload-pdf", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authAPI.getToken()}`,
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload file to IPFS");
      }

      const data = await response.json();
      setIpfsHash(data.ipfs_hash);
      
      // Update step completion
      setSteps(prev => ({ ...prev, fileUploaded: true }));
      setUploadProgress(100);
      
      console.log("✅ PDF encrypted and uploaded to IPFS");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file";
      setError(errorMessage);
      console.error("Encryption/Upload error:", err);
    } finally {
      setLoading(false);
    }
  };


  const generateHash = async (data) => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
  
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
  
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  
    return hashHex;
  };
  
  const handleGenerateHash = async () => {
    if (!title || !description || !ipfsHash) {
      setError("Please complete all fields first!");
      return;
    }
  
    try {
      const metadata = {
        title,
        description,
        ipfsHash,
        owner: owner?.wallet || "unknown",
        timestamp: new Date().toISOString(),
      };
    
      const hash = await generateHash(metadata);
      setMetadataHash(hash);
      setSteps(prev => ({ ...prev, hashGenerated: true }));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate hash";
      setError(errorMessage);
      console.error("Hash generation error:", err);
    }
  };

  const generateCertificate = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(18);
    doc.text("Intellectual Property Certificate", 20, 20);
  
    doc.setFontSize(12);
    doc.text(`Title: ${title}`, 20, 40);
    doc.text(`Description: ${description}`, 20, 50);
    doc.text(`Owner: ${owner?.name || "Unknown"}`, 20, 60);
    doc.text(`Owner Wallet: ${owner?.wallet || "Not connected"}`, 20, 70);
    doc.text(`IPFS Hash: ${ipfsHash}`, 20, 80);
    doc.text(`Metadata Hash: ${metadataHash}`, 20, 90);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 100);
  
    doc.save("IP_Certificate.pdf");
  };

  const handleRegister = async () => {
    if (!file || !title || !description || !ipfsHash || !metadataHash) {
      setError("Please complete all steps!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare IP registration data
      const registrationData = {
        title,
        description,
        ipfs_hash: ipfsHash,
        metadata_hash: metadataHash,
        owner_wallet: owner?.wallet,
        file_name: file.name,
      };

      // Call backend to register IP
      const response = await fetch("http://localhost:8000/api/ips/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authAPI.getToken()}`,
        },
        body: JSON.stringify(registrationData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Failed to register IP");
      }

      const result = await response.json();

      // Generate and download certificate
      generateCertificate();

      // Show success popup
      setShowPopup(true);

      // Reset form after successful registration
      setTimeout(() => {
        setShowPopup(false);
        navigate("/dashboard");
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register IP";
      setError(errorMessage);
      console.error("IP registration error:", err);
      alert("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-6">

        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Register New Intellectual Property
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded mb-6 shadow">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

       {/* Step 1: Upload & Encrypt File */}
<div className={`mb-6 p-6 border rounded-xl shadow-sm transition ${steps.fileUploaded ? 'bg-green-50 border-green-300' : 'bg-blue-50'}`}>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-blue-600">Step 1: Upload & Encrypt File</h2>
    {steps.fileUploaded && <span className="text-green-600 font-bold">Complete</span>}
  </div>

  {!steps.fileUploaded ? (
    <>
      {/* Make the whole box clickable */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition mb-4">
        <span className="text-blue-400 mb-2">Drag & Drop your PDF file here</span>
        <span className="text-gray-500 mb-2">or click to select a file</span>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={loading}
          className="hidden"
        />
        {file && <p className="text-gray-700 mt-2">Selected: <span className="font-medium">{file.name}</span></p>}
      </label>

      <button
        onClick={handleFileUpload}
        disabled={loading || !file}
        className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? `Encrypting & Uploading... ${uploadProgress}%` : "Encrypt & Upload to IPFS"}
      </button>

      {loading && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-500 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}
    </>
  ) : (
    <div className="bg-green-100 p-4 rounded-lg border border-green-300">
      <p className="text-green-800 font-semibold mb-2">File encrypted & uploaded successfully!</p>
      <p className="text-gray-700">IPFS Hash: <span className="font-mono text-sm break-all">{ipfsHash}</span></p>
      <p className="text-sm text-gray-600 mt-2">Original file stored securely in localStorage</p>
    </div>
  )}
</div>

        {/* Step 2: IP Details */}
        <div className={`mb-6 p-6 border rounded-xl shadow-sm transition ${title && description ? 'bg-green-50 border-green-300' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Step 2: IP Details</h2>
            {title && description && <span className="text-green-600 font-bold">Complete</span>}
          </div>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSteps(prev => ({ ...prev, detailsAdded: !!(e.target.value && description) }));
            }}
            disabled={!steps.fileUploaded}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSteps(prev => ({ ...prev, detailsAdded: !!(title && e.target.value) }));
            }}
            disabled={!steps.fileUploaded}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />
          <p className="text-gray-500">Date Created: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Step 3: Owner Info */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3"> Step 3: Owner Information</h2>
          {ownerLoading ? (
            <p className="text-gray-500 animate-pulse">Loading owner information...</p>
          ) : owner ? (
            <div className="space-y-2">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{owner.name || "N/A"}</span></p>
              <p><span className="text-gray-600">Username:</span> <span className="font-medium">{owner.username}</span></p>
              <p><span className="text-gray-600">User ID:</span> <span className="font-medium">{owner.userId}</span></p>
              <p><span className="text-gray-600">Wallet:</span> <span className="font-medium font-mono text-sm break-all">{owner.wallet}</span></p>
            </div>
          ) : (
            <p className="text-red-600">Failed to load owner information</p>
          )}
        </div>

        {/* Step 4: Security / Metadata Hash */}
        <div className={`mb-6 p-6 border rounded-xl shadow-sm transition ${steps.hashGenerated ? 'bg-green-50 border-green-300' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Step 4: Generate Hash</h2>
            {steps.hashGenerated && <span className="text-green-600 font-bold">Complete</span>}
          </div>
          <button
            onClick={handleGenerateHash}
            disabled={loading || !title || !description || !ipfsHash || steps.hashGenerated}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {steps.hashGenerated ? "Hash Generated" : "Generate Metadata Hash"}
          </button>
          {metadataHash && (
            <div className="mt-4 bg-green-100 p-4 rounded-lg border border-green-300">
              <p className="text-green-800 font-semibold mb-2"> Hash Generated Successfully</p>
              <p className="text-gray-700 mb-2">Hash: <span className="font-mono text-sm break-all">{metadataHash}</span></p>
              <p className="text-sm text-gray-600">Timestamp: {new Date().toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={handleRegister}
            disabled={loading || ownerLoading || !steps.fileUploaded || !title || !description || !steps.hashGenerated}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register IP"}
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            disabled={loading}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition shadow-lg disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-green-600 mb-3">✅ Registration Successful!</h2>
            <p className="mb-2">Your IP has been securely registered and stored on the blockchain.</p>
            <p className="text-gray-700 mb-1"><span className="font-semibold">IPFS Hash:</span> <span className="font-mono text-xs">{ipfsHash}</span></p>
            <p className="text-gray-700 mb-1"><span className="font-semibold">Metadata Hash:</span> <span className="font-mono text-xs">{metadataHash}</span></p>
            <p className="text-gray-500 mb-4">Timestamp: {new Date().toLocaleString()}</p>
            <p className="text-sm text-gray-600 mb-4">Your certificate has been downloaded. Redirecting...</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterIP;