import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterIP() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metadataHash, setMetadataHash] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleFileUpload = () => {
    if (file) setIpfsHash("QmXyz123ABC...");
  };

  const handleGenerateHash = () => {
    if (title && description && ipfsHash) setMetadataHash("0xHASHXYZ123...");
  };

  const handleRegister = () => {
    if (file && title && description && ipfsHash && metadataHash) setShowPopup(true);
    else alert("Please complete all steps!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-6">

        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Register New Intellectual Property
        </h1>

       {/* Step 1: Upload File */}
<div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
  <h2 className="text-xl font-semibold text-blue-600 mb-3">📂 Upload File</h2>

  {/* Make the whole box clickable */}
  <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition mb-3">
    <span className="text-blue-400 mb-2">Drag & Drop your file here</span>
    <span className="text-gray-500 mb-2">or click to select a file</span>
    <input
      type="file"
      onChange={(e) => setFile(e.target.files[0])}
      className="hidden" // hide the default input
    />
    {file && <p className="text-gray-700 mt-2">Selected File: <span className="font-medium">{file.name}</span></p>}
  </label>

  <button
    onClick={handleFileUpload}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
  >
    Upload to IPFS
  </button>

  {ipfsHash && <p className="text-gray-700 mt-2">IPFS Hash: {ipfsHash}</p>}
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
          <p>Name: <span className="font-medium">Sneha Thapa</span></p>
          <p>User ID: <span className="font-medium">101</span></p>
          <p>Wallet Address: <span className="font-medium">0xABC123...</span></p>
        </div>

        {/* Step 4: Security / Metadata Hash */}
        <div className="mb-6 p-6 border rounded-xl shadow-sm bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">🔑 Security / Hash</h2>
          <button
            onClick={handleGenerateHash}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mb-2"
          >
            Generate Metadata Hash
          </button>
          {metadataHash && <p className="text-gray-700">Metadata Hash: {metadataHash}</p>}
          {metadataHash && <p className="text-gray-500">Timestamp: {new Date().toLocaleString()}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-4">
          <button
            onClick={handleRegister}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg"
          >
            Register IP
          </button>
          <button
            onClick={() => navigate("/HomePage")}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition shadow-lg"
          >
            Cancel
          </button>
        </div>

      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-blue-600 mb-3">✅ Registration Successful</h2>
            <p className="mb-2">Your IP has been securely stored.</p>
            <p className="text-gray-700 mb-1">IPFS Hash: {ipfsHash}</p>
            <p className="text-gray-700 mb-1">Metadata Hash: {metadataHash}</p>
            <p className="text-gray-500 mb-4">Timestamp: {new Date().toLocaleString()}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterIP;