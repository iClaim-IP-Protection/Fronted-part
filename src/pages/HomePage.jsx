import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { dashboardAPI, authAPI } from "../services/api";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState(null);
  
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current user info
        const userInfo = await authAPI.getCurrentUser();
        
        if (!userInfo || !userInfo.username) {
          setError("Unable to retrieve user information");
          navigate("/login");
          return;
        }

        setUsername(userInfo.username);

        // Fetch dashboard data
        const dashboardData = await dashboardAPI.getDashboard(userInfo.username);
        
        if (!dashboardData) {
          setError("Unable to retrieve dashboard data");
          return;
        }

        // Normalize and validate dashboard data
        const normalizedData = {
          total_ips: dashboardData.total_ips ?? 0,
          verified_ips: dashboardData.verified_ips ?? 0,
          transfers: dashboardData.transfers ?? 0,
          ips: Array.isArray(dashboardData.ips) ? dashboardData.ips : [],
        };

        setData(normalizedData);
        console.log("Dashboard data loaded successfully:", normalizedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Dashboard fetch error:", errorMessage);
        
        // Only redirect to login for auth-related errors
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    // Check if user is authenticated before fetching
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-1/5 bg-blue-900 text-white p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-10">iClaim</h1>
        {username && (
          <div className="mb-8 pb-6 border-b border-blue-700">
            <p className="text-sm text-blue-200">Logged in as</p>
            <p className="text-lg font-semibold text-white">{username}</p>
          </div>
        )}
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
            <div className="text-center">
              <p className="text-xl text-gray-500">Loading dashboard...</p>
              <p className="text-sm text-gray-400 mt-2">Fetching your data from the server</p>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message (if any) */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded mb-6 shadow">
                <p className="font-semibold">Error Loading Dashboard</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Dashboard Content */}
            {data ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-200 text-blue-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                    <p className="text-sm font-semibold">Total IPs</p>
                    <p className="text-3xl font-bold">{data.total_ips}</p>
                  </div>
                  <div className="bg-green-200 text-green-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                    <p className="text-sm font-semibold">Verified IPs</p>
                    <p className="text-3xl font-bold">{data.verified_ips}</p>
                  </div>
                  <div className="bg-yellow-200 text-yellow-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
                    <p className="text-sm font-semibold">Transfers</p>
                    <p className="text-3xl font-bold">{data.transfers}</p>
                  </div>
                </div>

                {/* IP Cards */}
                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Your IPs</h2>
                  {data.ips && data.ips.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {data.ips.map((ip) => (
                        <div
                          key={ip.id || ip.name}
                          className={`p-6 rounded shadow transform transition hover:scale-105 ${
                            ip.status === "verified" ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"
                          }`}
                        >
                          <h3 className="font-semibold text-lg">{ip.name || "Unknown"}</h3>
                          <p className="text-sm mt-2">
                            <span className="font-semibold">Status: </span>
                            {ip.status || "pending"}
                          </p>
                          {ip.address && <p className="text-sm text-gray-600 mt-1">{ip.address}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10 bg-gray-100 rounded">
                      <p className="text-lg">No IPs registered yet</p>
                      <Link
                        to="/registerIp"
                        className="text-blue-600 hover:text-blue-800 font-semibold mt-2 inline-block"
                      >
                        Register your first IP →
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              !loading && !error && (
                <div className="text-center text-gray-500 py-10">
                  <p className="text-lg">Unable to load dashboard data</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;