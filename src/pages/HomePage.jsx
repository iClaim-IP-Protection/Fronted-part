import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { dashboardAPI, authAPI } from "../services/api";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    total_ips: 0,
    verified_ips: 0,
    transfers: 0,
    ips: [],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          navigate("/login");
          return;
        }
        const dashboardData = await dashboardAPI.getDashboard(username);
        setData(dashboardData);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch dashboard:', err.message);
        // Keep using empty data if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('username');
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-1/5 bg-blue-900 text-white p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-10">iClaim</h1>
        <ul className="space-y-6">
          <li>
            <Link
              to="/dashboard"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/registerIp"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Register IP
            </Link>
          </li>
          <li>
            <Link
              to="/myAssets"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              My Assets
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Profile
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="cursor-pointer hover:text-blue-300 transition text-left w-full text-base"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-4/5 p-6 overflow-auto">

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Error Message (if any) */}
            {error && (
              <div className="bg-red-100 text-red-900 p-4 rounded mb-6 shadow">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-200 text-blue-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                Total IPs: {data.total_ips}
              </div>
              <div className="bg-green-200 text-green-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                Verified IPs: {data.verified_ips}
              </div>
              <div className="bg-yellow-200 text-yellow-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                Transfers: {data.transfers}
              </div>
            </div>

            {/* IP Cards */}
            {data.ips && data.ips.length > 0 ? (
              <div className="grid grid-cols-3 gap-6 mt-4">
                {data.ips.map((ip) => (
                  <div
                    key={ip.id}
                    className={`p-6 rounded shadow transform transition hover:scale-105 ${
                      ip.status === "verified" ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"
                    }`}
                  >
                    <h2 className="font-semibold text-lg">{ip.name}</h2>
                    <p>Status: {ip.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p className="text-lg">No IPs found. Start by registering one!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;