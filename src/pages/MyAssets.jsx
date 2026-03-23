// MyAssets.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assetsAPI } from "../services/api";

function MyAssets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          alert("Please log in first");
          navigate("/login");
          return;
        }
        const data = await assetsAPI.getUserAssets(username);
        setAssets(data.assets || []);
      } catch (err) {
        setError(err.message);
        alert(`Failed to fetch assets: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [navigate]);

  // Function to style status badges
  const getStatusColor = (status) => {
    if (status === "Verified") return "bg-green-100 text-green-800";
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <p className="text-xl text-blue-600">Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            <p className="text-xl font-semibold">{assets.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Verified IPs</p>
            <p className="text-xl font-semibold">
              {assets.filter((asset) => asset.status === "Verified").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Pending IPs</p>
            <p className="text-xl font-semibold">
              {assets.filter((asset) => asset.status === "Pending").length}
            </p>
          </div>
        </div>

        {/* Grid of IPs */}
        {assets.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">No assets found. Start by registering an IP!</p>
            <button
              onClick={() => navigate("/registerip")}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Register IP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl font-bold text-blue-600 mb-2">{asset.title}</h2>
                  <p className="text-gray-700 mb-2">{asset.description}</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      asset.status
                    )}`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div className="mt-4 text-gray-600 text-sm">
                  <p>IPFS Hash: {asset.ipfsHash}</p>
                  <p>Metadata: {asset.metadataHash}</p>
                  <p>Date: {asset.date}</p>
                </div>

                <button
                  onClick={() => navigate(`/registerip`)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow"
                >
                  View / Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAssets;