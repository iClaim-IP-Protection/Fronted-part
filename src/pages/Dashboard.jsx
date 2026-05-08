import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { dashboardAPI, authAPI } from "../services/api";
import { useWallet } from "../context/WalletContext";

function Dashboard() {
  const navigate = useNavigate();
  const { walletAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch dashboard data from /api/dashboard/me endpoint
        const data = await dashboardAPI.getDashboard();
        
        if (!data) {
          setError("Unable to retrieve dashboard data");
          return;
        }

        setDashboardData(data);
        console.log("Dashboard data loaded successfully:", data);
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
      <div className="w-1/5 bg-white text-black p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-10">iClaim</h1>
        {dashboardData && (
          <div className="mb-8 pb-6 border-b border-blue-700">
            <p className="text-sm text-black-200">Logged in as</p>
            <p className="text-lg font-semibold text-black">{dashboardData.username}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-black-100">
                {isConnected ? 'Wallet Connected' : 'No Wallet'}
              </span>
            </div>
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
              to="/connect-wallet"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Connect Wallet
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
              to="/assets"
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
            {dashboardData ? (
              <>
                {/* Welcome Section */}
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-800">
                    Welcome, {dashboardData.first_name || dashboardData.username}!
                  </h1>
                  <p className="text-gray-600 mt-2">Here's your intellectual property overview</p>
                </div>

                {/* User Info Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Account Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Name</p>
                      <p className="text-lg text-gray-800">{dashboardData.first_name} {dashboardData.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Email</p>
                      <p className="text-lg text-gray-800">{dashboardData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Wallet Address</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isConnected ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-sm text-gray-800 font-mono break-all">{walletAddress}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            {dashboardData.wallet_address ? dashboardData.wallet_address : "Not connected"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Member Since</p>
                      <p className="text-lg text-gray-800">
                        {new Date(dashboardData.date_created).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transform transition hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 font-semibold text-sm">Total Assets</p>
                        <p className="text-4xl font-bold mt-2">{dashboardData.asset_count}</p>
                      </div>
                      <div className="text-5xl opacity-20"> </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transform transition hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 font-semibold text-sm">IP Registrations</p>
                        <p className="text-4xl font-bold mt-2">{dashboardData.ip_count}</p>
                      </div>
                      <div className="text-5xl opacity-20"> </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transform transition hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 font-semibold text-sm">Certifications</p>
                        <p className="text-4xl font-bold mt-2">{dashboardData.certifications_count}</p>
                      </div>
                      <div className="text-5xl opacity-20"> </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <Link
                      to="/assets"
                      className="bg-white hover:bg-blue-50 border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg text-center transition"
                    >
                      View Assets
                    </Link>
                    <Link
                      to="/registerIp"
                      className="bg-white hover:bg-green-50 border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg text-center transition"
                    >
                      Register IP
                    </Link>
                    <Link
                      to="/profile"
                      className="bg-white hover:bg-purple-50 border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg text-center transition"
                    >
                      Edit Profile
                    </Link>
                  </div>
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

export default Dashboard;