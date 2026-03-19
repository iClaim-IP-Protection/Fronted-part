// MyProfile.jsx
import React, { useState, useEffect } from "react";

function MyProfile() {
  // Dummy user data
  const [user, setUser] = useState({
    name: "Sneha Thapa",
    username: "sneha123",
    email: "sneha@gmail.com",
    wallet: "", // will be updated by Solana wallet
    password: "*********",
    totalArticles: 10,
    certificates: 5,
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);

  // Solana wallet state
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");

  // Check if wallet already connected on page load
  useEffect(() => {
    const savedWallet = localStorage.getItem("wallet");
  
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setUser((prev) => ({ ...prev, wallet: savedWallet }));
    }
  }, []);

  // Handle wallet connect
  const connectWallet = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setUser((prev) => ({ ...prev, wallet: response.publicKey.toString() }));
        localStorage.setItem("wallet", response.publicKey.toString());
        setWalletError("");
      } catch (err) {
        const address = response.publicKey.toString();

    setWalletAddress(address);
    setUser((prev) => ({ ...prev, wallet: address }));

// ✅ ADD THIS
    localStorage.setItem("wallet", address);
        setWalletError("Wallet connection rejected!");
      }
    } else {
      setWalletError("Phantom Wallet is not installed!");
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress("");
    setUser((prev) => ({ ...prev, wallet: "" }));
    setWalletError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    setUser(formData);
    setEditMode(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-6">

        {/* Header */}
        <h1 className="text-3xl font-bold text-blue-600 text-center">My Profile</h1>

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

          {/* Solana Wallet */}
          <div>
            <label className="text-gray-700 font-medium">Wallet Address:</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={walletAddress || "Not Connected"}
                disabled
                className="w-full p-2 rounded border bg-blue-100 cursor-not-allowed"
              />
              {walletAddress ? (
                <button
                  onClick={disconnectWallet}
                  className="bg-gray-400 text-white px-3 rounded hover:bg-gray-500 transition"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-blue-500 text-white px-3 rounded hover:bg-blue-600 transition"
                >
                  Connect
                </button>
              )}
            </div>
            {walletError && <p className="text-red-500 mt-1">{walletError}</p>}
          </div>
        </div>

        {/* Security Section */}
        <div className="p-4 border rounded-xl bg-blue-50 flex justify-between items-center">
          <div>
            <p className="text-gray-700 font-medium">Password: {user.password}</p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
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
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg"
            >
              Save Changes
            </button>
          )}
          <button
            onClick={() => window.location.href = "/dashboard"} // simple redirect for now
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition shadow-lg"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}

export default MyProfile;