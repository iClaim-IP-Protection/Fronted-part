// MyAssets.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assetsAPI, authAPI } from "../services/api";

function MyAssets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        // Check authentication first
        if (!authAPI.isAuthenticated()) {
          navigate("/login");
          return;
        }

        // Fetch current user from API
        const userInfo = await authAPI.getCurrentUser();
        if (!userInfo || !userInfo.username) {
          setError("Unable to retrieve user information");
          navigate("/login");
          return;
        }

        // Fetch assets for the logged-in user
        const data = await assetsAPI.getAssets();
        setAssets(data.assets || data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch assets";
        setError(errorMessage);
        console.error("Error fetching assets:", err);
        
        // Only redirect to login for auth errors
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [navigate]);



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
          My Assets
        </h1>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow mb-8">
          <div className="text-center">
            <p className="text-gray-500">Total Assets</p>
            <p className="text-3xl font-semibold text-blue-600">{assets.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Latest Asset</p>
            <p className="text-3xl font-semibold text-green-600">
              {assets.length > 0 ? assets[0]?.title?.substring(0, 15) : "—"}
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate("/registerIp")}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Register New Asset
            </button>
          </div>
        </div>

        {/* Grid of Assets */}
        {assets.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">No assets found. Start by registering an asset!</p>
            <button
              onClick={() => navigate("/registerIp")}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Register Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.asset_id || asset.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl font-bold text-blue-600 mb-2">{asset.title}</h2>
                  <div className="text-sm text-gray-600 mb-3">
                    <p><span className="font-medium">Asset ID:</span> {asset.asset_id}</p>
                    <p><span className="font-medium">Date Created:</span> {new Date(asset.date_created).toLocaleDateString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/assets/${asset.asset_id || asset.id}`)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow"
                >
                  View Details
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