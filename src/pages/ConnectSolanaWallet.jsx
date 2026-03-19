// ConnectSolanaWallet.jsx
import React, { useState, useEffect } from "react";

function ConnectSolanaWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState("");

  // Check if wallet is already connected on page load
  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      window.solana.connect({ onlyIfTrusted: true })
        .then(({ publicKey }) => setWalletAddress(publicKey.toString()))
        .catch(() => {}); // ignore if not connected
    }
  }, []);

  // Function to connect wallet
  const connectWallet = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setError("");

        //here we have to write backend part 


      } catch (err) {
        setError("Wallet connection rejected!");
      }
    } else {
      setError("Phantom Wallet is not installed. Please install it.");
    }
  };

  // Disconnect (just reset state)
  const disconnectWallet = () => {
    setWalletAddress(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-blue-600">Connect Solana Wallet</h1>

        {walletAddress ? (
          <div className="space-y-4">
            <p className="text-gray-700">Connected Wallet:</p>
            <p className="text-lg font-medium bg-blue-100 p-2 rounded">{walletAddress}</p>
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
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition shadow-lg"
            >
              Connect Phantom Wallet
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectSolanaWallet;