// ConnectSolanaWallet.jsx
import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";

function ConnectSolanaWallet() {
  const { walletAddress, connectWallet, disconnectWallet, error } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [localError, setLocalError] = useState("");

  const handleConnect = async () => {
    try {
      setLoading(true);
      setLocalError("");
      setSuccess("");

      await connectWallet();
      setSuccess("Wallet connected and saved successfully!");
    } catch (err) {
      setLocalError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect your wallet? This will remove it from your profile."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setLocalError("");
      setSuccess("");

      await disconnectWallet();
      setSuccess("Wallet disconnected successfully!");
    } catch (err) {
      setLocalError(err.message || "Failed to disconnect wallet");
    } finally {
      setLoading(false);
    }
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
              onClick={handleDisconnect}
              disabled={loading}
              className={`bg-gray-400 text-white px-6 py-2 rounded-lg transition ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-500"
              }`}
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </button>
            {success && <p className="text-green-600 text-sm font-semibold">{success}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No wallet connected</p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`bg-blue-500 text-white px-6 py-3 rounded-lg transition shadow-lg ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
              }`}
            >
              {loading ? "Connecting..." : "Connect Phantom Wallet"}
            </button>
            {(localError || error) && (
              <p className="text-red-500 mt-2 text-sm">{localError || error}</p>
            )}
            {success && <p className="text-green-600 mt-2 text-sm font-semibold">{success}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectSolanaWallet;