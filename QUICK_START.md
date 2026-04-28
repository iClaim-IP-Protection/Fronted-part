# Blockchain Integration - Quick Start Guide

## Installation Steps

### Step 1: Update App.jsx

Add `BlockchainProvider` wrapper to your application:

```jsx
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { WalletProvider } from "./context/WalletContext";
import { BlockchainProvider } from "./context/BlockchainContext";  // ADD THIS
import Dashboard from "./pages/Dashboard";
// ... other imports

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <WalletProvider>
        <BlockchainProvider>  {/* ADD THIS WRAPPER */}
          <Routes>
            {/* Your routes here */}
          </Routes>
        </BlockchainProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 2: Use Components in Your Pages

#### In an Asset Certification Flow

```jsx
import UploadDocumentForm from '../components/UploadDocumentForm';
import CertifyAssetForm from '../components/CertifyAssetForm';
import { useState } from 'react';

function CertificationPage({ assetId }) {
  const [documentHash, setDocumentHash] = useState(null);
  const [proofRecorded, setProofRecorded] = useState(false);

  const handleUploadSuccess = (data) => {
    setDocumentHash(data.documentHash);
    setProofRecorded(true);
  };

  return (
    <div className="certification-page">
      {!proofRecorded ? (
        <UploadDocumentForm
          assetId={assetId}
          onSuccess={handleUploadSuccess}
          onError={(err) => console.error(err)}
        />
      ) : (
        <CertifyAssetForm
          assetId={assetId}
          documentHash={documentHash}
          onSuccess={() => console.log('Asset certified!')}
          onError={(err) => console.error(err)}
        />
      )}
    </div>
  );
}

export default CertificationPage;
```

#### In Asset Details Page

```jsx
import TransactionHistoryView from '../components/TransactionHistoryView';

function AssetDetailsPage({ assetId }) {
  return (
    <div className="asset-details">
      <h1>Asset Details</h1>
      <p>Asset ID: {assetId}</p>
      
      {/* Show blockchain transactions */}
      <TransactionHistoryView assetId={assetId} />
    </div>
  );
}

export default AssetDetailsPage;
```

### Step 3: Use Context Hook for Custom Logic

```jsx
import { useBlockchain } from '../context/BlockchainContext';
import { useWallet } from '../context/WalletContext';

function CustomComponent({ assetId, documentHash }) {
  const { certifyAsset, certificationState } = useBlockchain();
  const { walletAddress } = useWallet();

  const handleCustomCertify = async () => {
    if (!walletAddress) {
      alert('Please connect wallet first');
      return;
    }

    try {
      const result = await certifyAsset(assetId, nftHash, certHash);
      console.log('Certification result:', result);
    } catch (error) {
      console.error('Certification failed:', error);
    }
  };

  return (
    <div>
      <p>Status: {certificationState.status}</p>
      <button onClick={handleCustomCertify}>Certify</button>
    </div>
  );
}
```

## File Structure Summary

```
src/
├── services/
│   ├── blockchainService.js          (NEW)
│   ├── transactionPolling.js         (NEW)
│   └── api.js                         (existing)
├── context/
│   ├── BlockchainContext.jsx         (NEW)
│   └── WalletContext.jsx             (existing)
├── components/
│   ├── UploadDocumentForm.jsx        (NEW)
│   ├── UploadDocumentForm.css        (NEW)
│   ├── CertifyAssetForm.jsx          (NEW)
│   ├── CertifyAssetForm.css          (NEW)
│   ├── TransactionHistoryView.jsx    (NEW)
│   ├── TransactionHistoryView.css    (NEW)
│   ├── StatusBadge.jsx               (NEW)
│   ├── StatusBadge.css               (NEW)
│   └── ... (existing components)
├── pages/
│   └── ... (existing pages)
├── App.jsx                            (NEEDS UPDATE)
├── main.jsx                           (existing)
└── index.css                          (existing)

BLOCKCHAIN_INTEGRATION.md              (NEW - Full documentation)
QUICK_START.md                         (This file)
```

## Available Hooks

### useBlockchain()

```jsx
const {
  // State
  proofState,           // { assetId, documentHash, status, timestamp, error }
  certificationState,   // { assetId, nftHash, certificateHash, nftTransaction, certTransaction, status, error }
  pollingState,         // { isPolling, pollAttempts, maxAttempts }
  transactions,         // { [assetId]: [...transactions] }

  // Methods
  recordProofOfOriginality,  // (assetId, documentHash) => Promise
  certifyAsset,              // (assetId, nftHash, certificateHash) => Promise
  getTransactionStatus,      // (transactionId) => Promise
  retryTransaction,          // (transactionId, type) => Promise
  getAssetTransactions,      // (assetId) => Promise
  pollTransactionStatus,     // (transactionId, onUpdate) => Promise
  pollBothTransactions,      // (nftTxId, certTxId, onNftUpdate, onCertUpdate) => Promise
  resetStates,               // () => void
} = useBlockchain();
```

### useWallet()

```jsx
const {
  walletAddress,      // string | null
  loading,            // boolean
  error,              // string | null
  connectWallet,      // () => Promise<string>
  disconnectWallet,   // () => Promise<void>
} = useWallet();
```

## Common Patterns

### Wait for Certification to Complete

```jsx
const handleCertify = async () => {
  try {
    const result = await certifyAsset(assetId, nftHash, certHash);
    const { nftTxId, certTxId } = result;

    // Wait for both transactions to finish
    const { nftResult, certResult } = await pollBothTransactions(nftTxId, certTxId);

    if (nftResult?.status === 'confirmed' && certResult?.status === 'confirmed') {
      // Both confirmed!
      showSuccess('Asset certified successfully!');
    }
  } catch (error) {
    showError(error.message);
  }
};
```

### Check if Prerequisites Are Met

```jsx
const canProceed = () => {
  if (!walletAddress) {
    setError('Please connect your wallet first');
    return false;
  }
  if (!documentHash) {
    setError('Please upload and confirm your document first');
    return false;
  }
  if (!assetId) {
    setError('Asset ID is missing');
    return false;
  }
  return true;
};
```

### Handle Transaction Retry

```jsx
const handleRetry = async (txId) => {
  try {
    const updatedStatus = await retryTransaction(txId);
    console.log('Transaction retried:', updatedStatus);
    // Re-poll for status updates
  } catch (error) {
    console.error('Retry failed:', error);
  }
};
```

## Styling Customization

All components include CSS modules that can be customized:

- `UploadDocumentForm.css` - File upload styling
- `CertifyAssetForm.css` - Certification form styling  
- `TransactionHistoryView.css` - Transaction list styling
- `StatusBadge.css` - Status indicator styling

Colors used:
- **Confirmed**: #4CAF50 (Green)
- **Pending**: #FFA500 (Orange)
- **Failed**: #F44336 (Red)
- **Primary**: #2196F3 (Blue)

## Troubleshooting

### "useBlockchain must be used within BlockchainProvider"
✅ Make sure BlockchainProvider is in App.jsx wrapper

### Hash generation fails
✅ Check browser supports Web Crypto API (all modern browsers)

### Transactions not updating
✅ Check browser console for API errors
✅ Verify JWT token is valid in localStorage
✅ Check backend is running on localhost:8000

### Copy to clipboard doesn't work
✅ Check browser supports Clipboard API (all modern browsers)
✅ HTTPS required in production (http works in development)

### Wallet not connecting
✅ Phantom wallet must be installed
✅ Check Phantom is set to correct network (Devnet)
✅ Check browser console for specific error

## Next Integration Steps

1. **Add to Dashboard**: Show recent transactions
2. **Add to AssetInfo**: Display transaction history
3. **Add to EditAsset**: Show certification status
4. **Add Notifications**: Toast alerts for user feedback
5. **Add Animations**: Loading spinners, success animations
6. **Mobile Optimization**: Test on mobile devices

## API Documentation

For detailed API information, see:
- [blockchainService.js](./src/services/blockchainService.js) - Function signatures
- [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) - Complete guide

## Support

For questions or issues:
1. Check [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md)
2. Review [frontend-message.md](./frontend-message.md) for requirements
3. Check browser console for detailed error messages
4. Verify backend is running and accessible

---

**Happy coding! 🚀**
