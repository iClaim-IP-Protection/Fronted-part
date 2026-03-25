import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import CryptoJS from "crypto-js";
import { authAPI, profileAPI } from "../services/api";

function RegisterIP() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [title, setTitle] = useState("");d
  const [description, setDescription] = useState("");
  const [metadataHash, setMetadataHash] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Owner info from API
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(true);

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
  
    setLoading(true);
    setError(null);
  
    try {
      // 1. Read the PDF file as ArrayBuffer
      const fileArrayBuffer = await file.arrayBuffer();
  
      // 2. Convert to WordArray (CryptoJS format)
      const wordArray = CryptoJS.lib.WordArray.create(fileArrayBuffer);
  
      // 3. Encrypt the file with AES
      const secretKey = "my-secret-key"; // key
      const encrypted = CryptoJS.AES.encrypt(wordArray, secretKey).toString();
  
      // 4. Store encrypted PDF in localStorage
      localStorage.setItem("encryptedPDF", encrypted);
  
      // 5. Convert encrypted string back to Blob for IPFS upload
      const encryptedBlob = new Blob([encrypted], { type: "application/pdf" });
  
      // 6. Prepare FormData for IPFS upload
      const formData = new FormData();
      formData.append("file", encryptedBlob, file.name);
  
      // 7. Upload to IPFS (same as your backend call)
      const response = await fetch("http://localhost:8000/api/ipfs/upload", {
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
      alert("PDF encrypted & uploaded to IPFS successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file";
      setError(errorMessage);
      console.error("IPFS upload error:", err);
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

       {/* Step 1: Upload File */}
<div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
  <h2 className="text-xl font-semibold text-blue-600 mb-3">📂 Upload File</h2>

  {/* Make the whole box clickable */}
  <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition mb-3">
    <span className="text-blue-400 mb-2">Drag & Drop your file here</span>
    <span className="text-gray-500 mb-2">or click to select a file</span>
    <input
      type="file"
      accept=".pdf"
      onChange={(e) => setFile(e.target.files[0])}
      className="hidden" // hide the default input
    />
    {file && <p className="text-gray-700 mt-2">Selected File: <span className="font-medium">{file.name}</span></p>}
  </label>

  <button
    onClick={handleFileUpload}
    disabled={loading || !file}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {loading ? "Uploading to IPFS..." : "Upload to IPFS"}
  </button>

  {ipfsHash && <p className="text-gray-700 mt-2">✅ IPFS Hash: <span className="font-mono text-sm">{ipfsHash}</span></p>}
</div>

        {/* Step 2: IP Details */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">📌 Intellectual Property Details</h2>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            rows={3}
          />
          <p className="text-gray-500">Date Created: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Step 3: Owner Info */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">👤 Owner Information</h2>
          {ownerLoading ? (
            <p className="text-gray-500">Loading owner information...</p>
          ) : owner ? (
            <>
              <p>Name: <span className="font-medium">{owner.name || "N/A"}</span></p>
              <p>Username: <span className="font-medium">{owner.username}</span></p>
              <p>User ID: <span className="font-medium">{owner.userId}</span></p>
              <p>Wallet Address: <span className="font-medium font-mono text-sm">{owner.wallet}</span></p>
            </>
          ) : (
            <p className="text-red-600">Failed to load owner information</p>
          )}
        </div>

        {/* Step 4: Security / Metadata Hash */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">🔑 Security / Hash</h2>
          <button
            onClick={handleGenerateHash}
            disabled={loading || !title || !description || !ipfsHash}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate Metadata Hash
          </button>
          {metadataHash && <p className="text-gray-700 mt-2">✅ Metadata Hash: <span className="font-mono text-sm">{metadataHash}</span></p>}
          {metadataHash && <p className="text-gray-500">Timestamp: {new Date().toLocaleString()}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-4">
          <button
            onClick={handleRegister}
            disabled={loading || ownerLoading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
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