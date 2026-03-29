// ConnectSolanaWallet.jsx
import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";

function ConnectSolanaWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Check if wallet is already connected on page load
  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      window.solana.connect({ onlyIfTrusted: true })
        .then(({ publicKey }) => setWalletAddress(publicKey.toString()))
        .catch(() => {}); // ignore if not connected
    }
  }, []);

  // Function to connect wallet and save to backend
  const connectWallet = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        // Connect to Phantom wallet
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        
        // Save wallet address to backend
        await authAPI.connectWallet(address);
        
        setWalletAddress(address);
        setSuccess("Wallet connected and saved successfully!");
        console.log("Wallet connected:", address);
      } catch (err) {
        const errorMsg = err.message || "Failed to connect wallet";
        setError(errorMsg);
        console.error("Error connecting wallet:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Phantom Wallet is not installed. Please install it.");
    }
  };

  // Disconnect (just reset state)
  const disconnectWallet = () => {
    setWalletAddress(null);
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-blue-600">Connect Solana Wallet</h1>

        {walletAddress ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded">
              <p className="font-semibold">✓ Wallet Connected</p>
            </div>
            <p className="text-gray-700">Connected Wallet:</p>
            <p className="text-lg font-medium bg-blue-100 p-3 rounded break-all text-sm">{walletAddress}</p>
            <button
              onClick={disconnectWallet}
              className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No wallet connected</p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className={`bg-blue-500 text-white px-6 py-3 rounded-lg transition shadow-lg ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
              }`}
            >
              {loading ? "Connecting..." : "Connect Phantom Wallet"}
            </button>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            {success && <p className="text-green-600 mt-2 text-sm font-semibold">{success}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectSolanaWallet;