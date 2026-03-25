import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileAPI, authAPI } from "../services/api";

function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User data from API
  const [user, setUser] = useState({
    name: "",
    username: "",
    email: "",
    wallet: "",
    totalArticles: 0,
    certificates: 0
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);

  // Modal state for Change Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
          navigate("/login");
          return;
        }

        // Fetch current user info
        const userInfo = await authAPI.getCurrentUser();
        if (!userInfo || !userInfo.username) {
          setError("Unable to retrieve user information");
          navigate("/login");
          return;
        }

        // Fetch profile data from database
        const profileData = await profileAPI.getProfile(userInfo.username);
        
        // Normalize profile data
        const normalizedUser = {
          name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),
          username: userInfo.username,
          email: profileData.email || "",
          wallet: profileData.wallet_address || "Not connected",
          totalArticles: profileData.total_articles || 0,
          certificates: profileData.certificates_issued || 0
        };

        setUser(normalizedUser);
        setFormData(normalizedUser);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile";
        setError(errorMessage);
        console.error("Error fetching profile:", err);
        
        // Only redirect to login for auth errors
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Save updated profile
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Fetch current user
      const userInfo = await authAPI.getCurrentUser();
      if (!userInfo || !userInfo.username) {
        throw new Error("Unable to retrieve user information");
      }

      // Prepare update data
      const updateData = {
        first_name: formData.name.split(" ")[0] || formData.name,
        last_name: formData.name.split(" ").slice(1).join(" ") || "",
        email: formData.email,
      };

      // Call update API
      await profileAPI.updateProfile(userInfo.username, updateData);
      setUser(formData);
      setEditMode(false);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      setError(errorMessage);
      alert(`❌ Failed to update profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setSaving(true);
    try {
      // Fetch current user
      const userInfo = await authAPI.getCurrentUser();
      if (!userInfo || !userInfo.username) {
        throw new Error("Unable to retrieve user information");
      }

      // Call password change API
      const response = await fetch("http://localhost:8000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authAPI.getToken()}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to change password");
      }

      alert("✅ Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      setPasswordError(errorMessage);
      console.error("Password change error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-blue-600 text-center">My Profile</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Picture & Edit */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-100">
              <div className="flex items-center gap-4">
                <img
                  src=""
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-2 border-blue-400"
                />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-gray-500">{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border rounded-xl bg-blue-50 space-y-3">
              <div>
                <label className="text-gray-700 font-medium">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled={!editMode}
                  onChange={handleChange}
                  className={`w-full p-2 mt-1 rounded border focus:ring-2 focus:ring-blue-300 outline-none ${
                    editMode ? "bg-white" : "bg-blue-100 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium">Username:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled={!editMode}
                  onChange={handleChange}
                  className={`w-full p-2 mt-1 rounded border focus:ring-2 focus:ring-blue-300 outline-none ${
                    editMode ? "bg-white" : "bg-blue-100 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled={!editMode}
                  onChange={handleChange}
                  className={`w-full p-2 mt-1 rounded border focus:ring-2 focus:ring-blue-300 outline-none ${
                    editMode ? "bg-white" : "bg-blue-100 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium">Wallet Address:</label>
                <input
                  type="text"
                  value={user.wallet}
                  disabled
                  className="w-full p-2 mt-1 rounded border bg-blue-100 cursor-not-allowed font-mono text-sm"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="p-4 border rounded-xl bg-blue-50 flex justify-between items-center">
              <div>
                <p className="text-gray-700 font-medium">Password: ••••••••</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Change Password
              </button>
            </div>

            {/* My Activity */}
            <div className="p-4 border rounded-xl bg-blue-50 grid grid-cols-2 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500">Total Articles</p>
                <p className="text-xl font-bold text-blue-600">{user.totalArticles}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500">Certificates Issued</p>
                <p className="text-xl font-bold text-blue-600">{user.certificates}</p>
              </div>
            </div>

            {/* Save / Logout Buttons */}
            <div className="flex justify-center gap-6">
              {editMode && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition shadow-lg"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">Change Password</h2>
            
            {/* Error Message */}
            {passwordError && (
              <div className="bg-red-100 border border-red-400 text-red-800 p-3 rounded-lg mb-4">
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={saving}
              className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving}
              className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={saving}
              className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none disabled:bg-gray-100"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className={`${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded-lg transition`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={saving}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProfile;