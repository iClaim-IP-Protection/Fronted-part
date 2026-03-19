// MyAssets.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Dummy data for demonstration
const dummyIPs = [
  {
    id: 1,
    title: "My Song",
    description: "A song about dreams and hope...",
    status: "Verified",
    ipfsHash: "QmXyz123ABC",
    metadataHash: "0xHASHXYZ",
    date: "19-Mar-2026",
  },
  {
    id: 2,
    title: "My Painting",
    description: "Abstract art with vibrant colors...",
    status: "Pending",
    ipfsHash: "QmABC123XYZ",
    metadataHash: "0xHASHABC",
    date: "18-Mar-2026",
  },
  {
    id: 3,
    title: "My Research Paper",
    description: "Blockchain applications in music IP...",
    status: "Verified",
    ipfsHash: "QmPaper456",
    metadataHash: "0xHASHPAPER",
    date: "15-Mar-2026",
  },
];

function MyAssets() {
  const navigate = useNavigate();

  // Function to style status badges
  const getStatusColor = (status) => {
    if (status === "Verified") return "bg-green-100 text-green-800";
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          My Intellectual Properties
        </h1>

        {/* Summary */}
        <div className="flex justify-around bg-white p-4 rounded-xl shadow mb-8">
          <div className="text-center">
            <p className="text-gray-500">Total IPs</p>
            <p className="text-xl font-semibold">{dummyIPs.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Verified IPs</p>
            <p className="text-xl font-semibold">
              {dummyIPs.filter((ip) => ip.status === "Verified").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Pending IPs</p>
            <p className="text-xl font-semibold">
              {dummyIPs.filter((ip) => ip.status === "Pending").length}
            </p>
          </div>
        </div>

        {/* Grid of IPs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyIPs.map((ip) => (
            <div
              key={ip.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-blue-600 mb-2">{ip.title}</h2>
                <p className="text-gray-700 mb-2">{ip.description}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    ip.status
                  )}`}
                >
                  {ip.status}
                </span>
              </div>

              <div className="mt-4 text-gray-600 text-sm">
                <p>IPFS Hash: {ip.ipfsHash}</p>
                <p>Metadata: {ip.metadataHash}</p>
                <p>Date: {ip.date}</p>
              </div>

              <button
                onClick={() => navigate("/registerip")}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow"
              >
                View / Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyAssets;