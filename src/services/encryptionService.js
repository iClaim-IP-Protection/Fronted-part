import { authAPI } from './api';

const API_URL = "http://localhost:8000/api/encryption";

// Helper function for API calls with auth
const getEncryptionHeaders = () => {
  const token = authAPI.getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };
};

// Compute ownership hash
// Request: { asset_id: number, owner_id: number }
// Response: { asset_id, owner_id, ownership_hash, timestamp }
export const computeOwnershipHash = async (assetId, ownerId) => {
  try {
    const payload = { asset_id: assetId, owner_id: ownerId };
    console.log("Computing ownership hash with payload:", payload);

    const response = await fetch(`${API_URL}/ownership`, {
      method: "POST",
      headers: getEncryptionHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.detail || error.message || 'Failed to compute ownership hash'}`);
    }

    const data = await response.json();
    console.log("Ownership hash computed:", data);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Ownership hash error: ${message}`);
  }
};

// Compute NFT hash
// Request: { asset_id: number, title: string }
// Response: { asset_id, title, nft_hash, timestamp }
export const computeNFTHash = async (assetId, title) => {
  try {
    const response = await fetch(`${API_URL}/nft`, {
      method: "POST",
      headers: getEncryptionHeaders(),
      body: JSON.stringify({ asset_id: assetId, title: title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.detail || error.message || 'Failed to compute NFT hash'}`);
    }

    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`NFT hash error: ${message}`);
  }
};

// Compute certificate hash
// Request: { ownership_hash: string, nft_hash: string }
// Response: { ownership_hash, nft_hash, certificate_hash, timestamp }
export const computeCertificateHash = async (ownershipHash, nftHash) => {
  try {
    const response = await fetch(`${API_URL}/certificate`, {
      method: "POST",
      headers: getEncryptionHeaders(),
      body: JSON.stringify({
        ownership_hash: ownershipHash,
        nft_hash: nftHash,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.detail || error.message || 'Failed to compute certificate hash'}`);
    }

    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Certificate hash error: ${message}`);
  }
};

// Compute all three hashes in sequence
export const computeAllHashes = async (assetId, ownerId, title) => {
  try {
    const ownership = await computeOwnershipHash(assetId, ownerId);
    const nft = await computeNFTHash(assetId, title);
    const certificate = await computeCertificateHash(
      ownership.ownership_hash,
      nft.nft_hash
    );

    return { ownership, nft, certificate };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to compute hashes: ${message}`);
  }
};

// Save certification to database
// Request: { user_id, nft_id, ownership_hash, nft_hash, certificate_hash }
// Response: { id, user_id, nft_id, ... }
export const saveCertification = async (certificationData) => {
  try {
    console.log("Saving certification to database with data:", certificationData);

    const response = await fetch("http://localhost:8000/api/certifications", {
      method: "POST",
      headers: getEncryptionHeaders(),
      body: JSON.stringify(certificationData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Save certification error response:", error);
      throw new Error(`HTTP ${response.status}: ${error.detail || error.message || 'Failed to save certification'}`);
    }

    const savedData = await response.json();
    console.log("Certification saved successfully to database:", savedData);
    return savedData;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Certification save error:", message);
    throw new Error(`Certification save error: ${message}`);
  }
};

// Get certification details
// Response: { id, user_id, nft_id, ownership_hash, nft_hash, certificate_hash, date_certified }
export const getCertification = async (certificationId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/certifications/${certificationId}`, {
      method: "GET",
      headers: getEncryptionHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.detail || error.message || 'Failed to fetch certification'}`);
    }

    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Certification fetch error: ${message}`);
  }
};
