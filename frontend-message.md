# Frontend Implementation Instructions for iClaim Solana Integration

**Version**: 1.0  
**Date**: April 15, 2026  
**Target**: Frontend React/Vue Application  
**Purpose**: Implement Solana blockchain integration UI components

---

## Overview

The backend has implemented a complete Solana blockchain integration with two checkpoints for immutable record-keeping. Your frontend needs to implement the UI and interactions for both checkpoints.

### What the User Sees

```
1. Upload Document Screen
   ├─ File upload input
   ├─ Display document hash (SHA256)
   ├─ Show "Proof of originality recorded" confirmation
   └─ Ready for certification

2. Certify Asset Screen
   ├─ "Certify" button
   ├─ Show NFT transaction signature
   ├─ Show Certificate transaction signature
   ├─ Display transaction status (PENDING → CONFIRMED)
   ├─ "View on Blockchain" links (when confirmed)
   └─ "Retry" buttons (if failed)

3. Asset Details Screen
   ├─ Show all blockchain transactions
   ├─ Display transaction status
   ├─ Links to Solana Explorer
   └─ Retry option for pending transactions
```

---

## Backend Endpoints Available

All endpoints require: `Authorization: Bearer {token}` header

### Checkpoint A: Proof of Originality

```
POST /api/blockchain/checkpoint-a/proof-of-originality

Request:
{
  "asset_id": 1,
  "document_hash": "abc123def456..."
}

Response (200):
{
  "asset_id": 1,
  "document_hash": "abc123def456...",
  "message": "Proof of originality recorded successfully",
  "timestamp": "2026-04-15T10:30:00"
}

Errors:
- 400: Asset not found
- 500: Server error
```

### Checkpoint B: Certify & Mint

```
POST /api/blockchain/checkpoint-b/certify

Request:
{
  "asset_id": 1,
  "nft_hash": "nft_hash_value_here",
  "certificate_hash": "certificate_hash_value_here"
}

Response (200):
{
  "asset_id": 1,
  "nft_transaction": {
    "transaction_id": 5,
    "transaction_signature": "3a4b5c6d...",
    "transaction_type": "nft_mint",
    "status": "pending",
    "data_hash": "nft_hash_value",
    "block_number": null,
    "date_created": "2026-04-15T10:31:00",
    "date_confirmed": null
  },
  "certificate_transaction": {
    "transaction_id": 6,
    "transaction_signature": "7e8f9g0h...",
    "transaction_type": "certificate_mint",
    "status": "pending",
    "data_hash": "certificate_hash_value",
    "block_number": null,
    "date_created": "2026-04-15T10:31:05",
    "date_confirmed": null
  },
  "message": "Asset certified successfully..."
}

Errors:
- 400: Wallet not connected, asset not found, or upload document first
- 500: Server error
```

### Check Transaction Status

```
GET /api/blockchain/transaction/{tx_id}/status

Response (200):
{
  "transaction_id": 5,
  "transaction_signature": "3a4b5c6d...",
  "status": "confirmed",  // or "pending" or "failed"
  "block_number": 199568402,
  "date_confirmed": "2026-04-15T10:31:30",
  "data_hash": "nft_hash_value"
}
```

### Retry Transaction

```
POST /api/blockchain/transaction/{tx_id}/retry

Response (200):
{
  "transaction_id": 5,
  "transaction_signature": "3a4b5c6d...",
  "status": "confirmed",
  "block_number": 199568402,
  "date_confirmed": "2026-04-15T10:31:30",
  "data_hash": "nft_hash_value"
}
```

### Get Asset Transactions

```
GET /api/blockchain/asset/{asset_id}/transactions

Response (200):
{
  "asset_id": 1,
  "transactions": [
    {
      "transaction_id": 5,
      "transaction_signature": "3a4b5c6d...",
      "status": "confirmed",
      "data_hash": "nft_hash_value",
      "block_number": 199568402,
      "date_confirmed": "2026-04-15T10:31:30"
    },
    {
      "transaction_id": 6,
      "transaction_signature": "7e8f9g0h...",
      "status": "pending",
      "data_hash": "certificate_hash_value",
      "block_number": null,
      "date_confirmed": null
    }
  ],
  "total_transactions": 2
}
```

---

## Feature 1: Document Upload (Checkpoint A)

### UI Requirements

**Component**: `UploadDocumentForm` or similar

```
┌─────────────────────────────────────┐
│ Upload Your Document                │
├─────────────────────────────────────┤
│ [Choose File...] [Upload]           │
├─────────────────────────────────────┤
│ Status: ⏳ Uploading...              │
├─────────────────────────────────────┤
│ ✅ Document Uploaded                │
│ Document Hash:                      │
│ abc123def456xyz789...               │
│                                     │
│ ✅ Proof of Originality Recorded    │
│ Your document timestamp is secured  │
│                                     │
│ [Next: Certify Asset →]             │
└─────────────────────────────────────┘
```

### Implementation Steps

1. **File Selection**
   - Accept file input (PDF, document, etc.)
   - Validate file size
   - Show file name to user

2. **Upload to Backend**
   - Call your existing file upload endpoint
   - Get back: ipfs_hash, asset_id

3. **Generate Document Hash** (Frontend)
   ```javascript
   async function generateDocumentHash(fileContent) {
     // Use crypto-js or subtle crypto
     const hashBuffer = await crypto.subtle.digest('SHA-256', fileContent);
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   }
   ```

4. **Call Blockchain Endpoint**
   ```javascript
   async function recordProofOfOriginality(assetId, documentHash) {
     const response = await fetch('/api/blockchain/checkpoint-a/proof-of-originality', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         asset_id: assetId,
         document_hash: documentHash
       })
     });
     
     if (!response.ok) {
       throw new Error('Failed to record proof of originality');
     }
     
     return await response.json();
   }
   ```

5. **Display Results**
   - Show document hash (copyable)
   - Show confirmation message
   - Show timestamp
   - Enable "Proceed to Certification" button

6. **State Management**
   - Store `assetId` for later use
   - Store `documentHash` for hash generation
   - Store `proofTimestamp` for display
   - Track upload status

### Error Handling

- File not selected → Show error message
- File too large → Show file size limit
- Upload failed → Show retry button
- Proof of originality failed → Show retry option
- Network error → Show offline message

---

## Feature 2: Certify Asset (Checkpoint B)

### UI Requirements

**Component**: `CertifyAssetForm` or similar

```
┌──────────────────────────────────────┐
│ Certify Your Asset                   │
├──────────────────────────────────────┤
│ Asset: My Invention                  │
│ Document Hash: abc123def456...       │
│                                      │
│ [Certify Now]                        │
├──────────────────────────────────────┤
│                                      │
│ NFT Transaction                      │
│ ├─ Status: ⏳ PENDING                │
│ ├─ Signature: 3a4b5c6d...          │
│ └─ [View on Blockchain]              │
│    [Retry]                           │
│                                      │
│ Certificate Transaction              │
│ ├─ Status: ⏳ PENDING                │
│ ├─ Signature: 7e8f9g0h...          │
│ └─ [View on Blockchain]              │
│    [Retry]                           │
│                                      │
│ ✅ Asset certified successfully!     │
│ Check back soon for blockchain       │
│ confirmation.                        │
└──────────────────────────────────────┘
```

### Implementation Steps

1. **Generate Hashes** (Frontend)
   ```javascript
   // NFT Hash: SHA256(asset_id:document_hash)
   async function generateNFTHash(assetId, documentHash) {
     const combined = `${assetId}:${documentHash}`;
     const hashBuffer = await crypto.subtle.digest('SHA-256', 
       new TextEncoder().encode(combined)
     );
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   }
   
   // Certificate Hash: SHA256(user_id:nft_hash:timestamp)
   async function generateCertificateHash(userId, nftHash) {
     const timestamp = new Date().toISOString();
     const combined = `${userId}:${nftHash}:${timestamp}`;
     const hashBuffer = await crypto.subtle.digest('SHA-256',
       new TextEncoder().encode(combined)
     );
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   }
   ```

2. **Call Blockchain Endpoint**
   ```javascript
   async function certifyAsset(assetId, nftHash, certificateHash) {
     const response = await fetch('/api/blockchain/checkpoint-b/certify', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         asset_id: assetId,
         nft_hash: nftHash,
         certificate_hash: certificateHash
       })
     });
     
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.detail || 'Certification failed');
     }
     
     return await response.json();
   }
   ```

3. **Display Results**
   - Show both transaction signatures
   - Show status badges (PENDING/CONFIRMED/FAILED)
   - Show transaction IDs for reference
   - Store transaction IDs in state/localStorage

4. **Handle Transactions**
   - Store nft_transaction_id and certificate_transaction_id
   - Display signatures (first 16 chars + ... + last 16 chars)
   - Make signatures copyable
   - Add timestamps

5. **State Management**
   - Track both transaction statuses separately
   - Store transaction responses
   - Track polling state
   - Handle partial failures

### Error Handling

- Wallet not connected → Show "Connect Phantom Wallet" message
- Document not uploaded → Show "Upload document first" message
- Hash generation failed → Show error with retry
- Certification failed → Show retry button
- Both transactions failed → Show restart option
- One transaction failed → Show individual retry for failed one

---

## Feature 3: Transaction Status Polling

### Polling Logic

1. **After Certification**
   - Start polling for both transactions
   - Poll interval: 5-10 seconds
   - Max attempts: 30 (5 minutes)

2. **Polling Implementation**
   ```javascript
   async function pollTransactionStatus(txId, maxAttempts = 30) {
     let attempts = 0;
     
     while (attempts < maxAttempts) {
       try {
         const response = await fetch(
           `/api/blockchain/transaction/${txId}/status`,
           {
             headers: {
               'Authorization': `Bearer ${token}`
             }
           }
         );
         
         const data = await response.json();
         
         // Update UI with new status
         updateTransactionUI(txId, data);
         
         if (data.status === 'confirmed' || data.status === 'failed') {
           return data;
         }
         
         // Wait before next poll
         await new Promise(resolve => setTimeout(resolve, 5000));
         attempts++;
         
       } catch (error) {
         console.error('Polling error:', error);
         attempts++;
       }
     }
     
     return null;
   }
   ```

3. **Status Update UI**
   - Change status badge color based on status
   - Show checkmark when confirmed
   - Show X when failed
   - Hide pending spinner when done

4. **Display Block Number**
   - When confirmed, show block number
   - Format: "Confirmed in block #199568402"

---

## Feature 4: Transaction History View

### UI Requirements

**Component**: `AssetTransactionHistory` or similar

```
┌──────────────────────────────────────┐
│ Transaction History                  │
├──────────────────────────────────────┤
│ Asset: My Invention                  │
├──────────────────────────────────────┤
│ NFT Transaction                      │
│ ├─ Type: NFT Mint                   │
│ ├─ Status: ✅ CONFIRMED             │
│ ├─ Block: 199568402                 │
│ ├─ Sig: 3a4b5c6d...xyz789         │
│ ├─ Created: Apr 15, 10:31:00 AM    │
│ ├─ Confirmed: Apr 15, 10:31:30 AM  │
│ └─ [View on Solana Explorer] [Copy] │
│                                      │
│ Certificate Transaction              │
│ ├─ Type: Certificate Mint           │
│ ├─ Status: ✅ CONFIRMED             │
│ ├─ Block: 199568403                 │
│ ├─ Sig: 7e8f9g0h...xyz789         │
│ ├─ Created: Apr 15, 10:31:05 AM    │
│ ├─ Confirmed: Apr 15, 10:31:35 AM  │
│ └─ [View on Solana Explorer] [Copy] │
└──────────────────────────────────────┘
```

### Implementation Steps

1. **Fetch Transactions**
   ```javascript
   async function getAssetTransactions(assetId) {
     const response = await fetch(
       `/api/blockchain/asset/${assetId}/transactions`,
       {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       }
     );
     
     return await response.json();
   }
   ```

2. **Display in Table/List**
   - Type: nft_mint or certificate_mint
   - Status badge with color coding
   - Transaction signature (shortened, copyable)
   - Block number (if confirmed)
   - Created and confirmed timestamps
   - Links to Solana Explorer

3. **Solana Explorer Links**
   ```
   https://explorer.solana.com/tx/{transaction_signature}?cluster=devnet
   ```
   - Open in new tab
   - Icon for external link

4. **Social Features**
   - Copy signature to clipboard
   - Share transaction link
   - Download transaction details as JSON

---

## Feature 5: Status Badges & Indicators

### Status Display

```
Pending: 🟡 ⏳ PENDING
Confirmed: 🟢 ✅ CONFIRMED
Failed: 🔴 ❌ FAILED
```

### Colors (Recommend)
```
PENDING: #FFA500 (Orange)
CONFIRMED: #4CAF50 (Green)
FAILED: #F44336 (Red)
```

### Icons
- Pending: Spinner/hourglass
- Confirmed: Checkmark
- Failed: X/alert

---

## Feature 6: Retry Mechanism

### Retry Button

```
┌────────────────────┐
│ [Retry] [Details]  │
└────────────────────┘
```

### Retry Logic

1. **Click Retry**
   - Call `/api/blockchain/transaction/{tx_id}/retry`
   - Show "Retrying..." status
   - Reset status badge

2. **After Retry**
   - If successful: Update to CONFIRMED
   - If failed: Show retry button again
   - Track retry attempts (optional)

3. **Implementation**
   ```javascript
   async function retryTransaction(txId) {
     try {
       const response = await fetch(
         `/api/blockchain/transaction/${txId}/retry`,
         {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${token}`
           }
         }
       );
       
       const data = await response.json();
       updateTransactionUI(txId, data);
       
     } catch (error) {
       showError('Retry failed: ' + error.message);
     }
   }
   ```

---

## Feature 7: Copy to Clipboard

### Implementation

```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('Failed to copy');
  }
}
```

### Usage
- Copy transaction signature
- Copy asset ID
- Copy document hash

---

## Data Flow Overview

```javascript
// Complete flow
const flow = async () => {
  // Step 1: Upload document
  const fileContent = await readFile(file);
  const documentHash = await generateDocumentHash(fileContent);
  const uploadResult = await uploadDocument(file);
  const assetId = uploadResult.asset_id;
  
  // Step 2: Record proof of originality
  await recordProofOfOriginality(assetId, documentHash);
  
  // Step 3: Certify asset
  const nftHash = await generateNFTHash(assetId, documentHash);
  const certHash = await generateCertificateHash(userId, nftHash);
  const certResult = await certifyAsset(assetId, nftHash, certHash);
  
  // Step 4: Poll status
  const nftTxId = certResult.nft_transaction.transaction_id;
  const certTxId = certResult.certificate_transaction.transaction_id;
  
  pollTransactionStatus(nftTxId);
  pollTransactionStatus(certTxId);
  
  // Step 5: Display results
  showTransactionUrls(certResult);
};
```

---

## Storage Requirements

### localStorage Items
```javascript
// Store for offline access
localStorage.setItem(`proof_${assetId}`, JSON.stringify({
  documentHash,
  timestamp,
  status: 'confirmed'
}));

localStorage.setItem(`certification_${assetId}`, JSON.stringify({
  nftHash,
  certHash,
  nftTxId,
  certTxId,
  status: 'pending'
}));
```

### State Management
```javascript
// Vue/React state
{
  // Checkpoint A
  documentHash: string,
  proofStatus: 'idle' | 'loading' | 'confirmed' | 'failed',
  proofTimestamp: Date,
  
  // Checkpoint B
  nftHash: string,
  certificateHash: string,
  nftTransaction: {
    id: number,
    signature: string,
    status: string,
    blockNumber: number | null,
    dateConfirmed: Date | null
  },
  certTransaction: {
    id: number,
    signature: string,
    status: string,
    blockNumber: number | null,
    dateConfirmed: Date | null
  },
  
  // Polling
  isPolling: boolean,
  pollAttempts: number
}
```

---

## Accessibility Requirements

- ✅ All buttons have aria-labels
- ✅ Status badges have color + icon + text (not just color)
- ✅ Links have title attributes
- ✅ Inputs have labels
- ✅ Error messages are announced
- ✅ Keyboard navigation works
- ✅ Copy buttons have confirmation feedback

---

## Error Messages Examples

```javascript
const errorMessages = {
  NO_WALLET: "Please connect your Phantom wallet first",
  NO_DOCUMENT: "Upload and confirm your document first",
  UPLOAD_FAILED: "Failed to upload document. Please try again.",
  PROOF_FAILED: "Could not record proof of originality",
  CERT_FAILED: "Certification failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  INVALID_FILE: "Please upload a valid file (PDF, DOC, etc.)"
};
```

---

## Security Notes

- ✅ Hash generation happens in frontend (no need to trust server)
- ✅ User can verify their document hash locally
- ✅ Transaction signatures stored securely
- ✅ No sensitive data in localStorage
- ✅ Always use HTTPS in production

---

## Performance Tips

1. **Lazy Load Transactions**
   - Load full history on demand
   - Show summary on asset card

2. **Debounce Copy Clicks**
   - Prevent multiple rapid copies
   - Reset button state after 2 seconds

3. **Cache Transaction Status**
   - Don't refetch confirmed transactions
   - Only poll pending ones

4. **Optimize Polling**
   - Check browser visibility
   - Stop polling if user leaves page
   - Exponential backoff on errors

---

## Testing Checklist

**Manual Testing**:
- [ ] Upload file and see document hash
- [ ] Verify proof of originality recorded
- [ ] Click Certify and see transaction signatures
- [ ] Watch status change from PENDING to CONFIRMED
- [ ] Click "View on Blockchain" and verify link works
- [ ] Test retry with intentionally failed transaction
- [ ] Verify copy to clipboard works
- [ ] Test with network offline (show error)
- [ ] Test with Phantom wallet disconnected
- [ ] Verify page refresh doesn't lose data

**Edge Cases**:
- [ ] Upload same file twice
- [ ] Certify before document upload completes
- [ ] Close page before certification completes
- [ ] Retry multiple times
- [ ] Very large files (test file size limits)

---

## Optional Enhancements

- [ ] Download transaction receipt as PDF
- [ ] Share on social media (Twitter: "My asset certified on Solana!")
- [ ] Email proof of certification
- [ ] QR code for transaction signature
- [ ] Timeline animation of 2 checkpoints
- [ ] Certificate printable template
- [ ] Batch certifications
- [ ] Certified badge on user profile

---

## Questions About Implementation?

Refer to these files in the backend repository:
- `INTEGRATION_EXAMPLES.md` - Frontend code examples
- `BLOCKCHAIN_INTEGRATION_GUIDE.md` - Complete API documentation
- `SOLANA_QUICK_REFERENCE.md` - Quick reference for endpoints

All endpoints are live at: `http://localhost:8000/api/blockchain/*`

---

**Good luck with implementation! 🎉**
