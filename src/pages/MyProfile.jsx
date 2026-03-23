import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileAPI, authAPI } from "../services/api";

function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dummy user data
  const [user, setUser] = useState({
    name: "Sneha Thapa",
    username: "sneha123",
    email: "sneha@gmail.com",
    wallet: "0xABC123...",
    password: "*********",
    totalArticles: 10,
    certificates: 5,
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);

  // Modal state for Change Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          alert("Please log in first");
          navigate("/login");
          return;
        }
        const data = await profileAPI.getProfile(username);
        setUser(data);
        setFormData(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error.message);
        // Keep using dummy data if API fails
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
    try {
      const username = localStorage.getItem('username');
      await profileAPI.updateProfile(username, formData);
      setUser(formData);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }
    // TODO: Call API to update password
    alert("Password changed successfully!");
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('username');
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-blue-600 text-center">My Profile</h1>

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
                  className="w-full p-2 mt-1 rounded border bg-blue-100 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="p-4 border rounded-xl bg-blue-50 flex justify-between items-center">
              <div>
                <p className="text-gray-700 font-medium">Password: {user.password}</p>
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
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePasswordChange}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
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