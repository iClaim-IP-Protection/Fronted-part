import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auto-load wallet from backend on app initialization
  useEffect(() => {
    const loadWalletFromBackend = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        if (user && user.wallet_address) {
          setWalletAddress(user.wallet_address);
          console.log("Wallet auto-loaded from backend:", user.wallet_address);
        }
      } catch (err) {
        console.error("Failed to auto-load wallet:", err);
        // Not critical - user may not have a wallet yet
      } finally {
        setLoading(false);
      }
    };

    if (authAPI.isAuthenticated()) {
      loadWalletFromBackend();
    } else {
      setLoading(false);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      setError("Phantom Wallet is not installed. Please install it.");
      throw new Error("Phantom Wallet is not installed");
    }

    try {
      setError("");

      // Connect to Phantom wallet
      const response = await window.solana.connect();
      console.log("Phantom response:", response);
      console.log("PublicKey object:", response.publicKey);
      console.log("PublicKey type:", typeof response.publicKey);
      
      const address = response.publicKey.toBase58();
      
      console.log("Converted address:", address);
      console.log("Address type:", typeof address);
      console.log("Address length:", address.length);

      // Save wallet address to backend
      console.log("Sending to backend:", { wallet_address: address });
      await authAPI.connectWallet(address);

      setWalletAddress(address);
      console.log("Wallet connected successfully:", address);
      return address;
    } catch (err) {
      const errorMsg = err.message || "Failed to connect wallet";
      setError(errorMsg);
      console.error("Error connecting wallet:", err);
      console.error("Error details:", err);
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      setError("");

      // Remove wallet from backend
      await authAPI.disconnectWallet();

      setWalletAddress(null);
      console.log("Wallet disconnected");
    } catch (err) {
      const errorMsg = err.message || "Failed to disconnect wallet";
      setError(errorMsg);
      console.error("Error disconnecting wallet:", err);
      throw err;
    }
  };

  const value = {
    walletAddress,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!walletAddress,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
