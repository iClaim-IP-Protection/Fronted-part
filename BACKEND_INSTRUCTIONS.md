# Backend Instructions for Blockchain Integration

**Date**: April 15, 2026  
**Task**: Support proper blockchain integration workflow  
**Communication**: These changes should work with the frontend flow described below

---

## Current User Flow

1. **User Registration & Login** → Dashboard ✅
2. **Connect Wallet** → Solana wallet connected ✅
3. **Register IP Asset** → File upload + asset details entered
4. **Asset Hash Storage** → SHA-256 hash generated and stored in DB
5. **Certify Asset** → Use stored asset data to mint on blockchain
6. **View Transactions** → Display blockchain transaction info

---

## Required Backend API Changes

### 1. Asset Registration/Upload Endpoint (EXISTING - VERIFY)

**Endpoint**: `POST /api/ipfs/upload`

**Changes Needed**:
- ✅ Accept file upload
- ✅ Generate SHA-256 hash of the uploaded file
- ✅ Store hash in database with asset record
- Return: `asset_id`, `ipfs_hash`, `document_hash` (SHA-256)

**Response Example**:
```json
{
  "asset_id": 1,
  "ipfs_hash": "QmXxxx...",
  "document_hash": "abc123def456...",  // NEW: SHA-256 of original file
  "asset_title": "My Invention",
  "date_created": "2026-04-15T10:30:00"
}
```

---

### 2. Asset Details Endpoint (EXISTING - ADD HASH)

**Endpoint**: `GET /api/ipfs/{asset_id}`

**Changes Needed**:
- Include `document_hash` in response (SHA-256 from registration)
- This hash was already generated during upload, just return it

**Response Example**:
```json
{
  "asset_id": 1,
  "asset_title": "My Invention",
  "ipfs_hash": "QmXxxx...",
  "document_hash": "abc123def456...",  // NEW: Include this
  "user_id": 5,
  "version": 1,
  "previous_asset_id": null,
  "date_created": "2026-04-15T10:30:00"
}
```

---

### 3. Checkpoint A: Proof of Originality (ALREADY EXISTS)

**Endpoint**: `POST /api/blockchain/checkpoint-a/proof-of-originality`

**Behavior**:
- Frontend sends: `asset_id`, `document_hash` (from asset DB)
- Backend: Records proof on blockchain
- This should happen DURING ASSET REGISTRATION, not during certification
- Optional: Can also be called separately if user wants to prove originality later

**Note**: The document_hash passed here must match what was stored during asset upload

---

### 4. Checkpoint B: Certify Asset (ALREADY EXISTS - VERIFY)

**Endpoint**: `POST /api/blockchain/checkpoint-b/certify`

**Requirements**:
- Frontend sends: `asset_id`, `nft_hash`, `certificate_hash`
- Backend: Submits both transactions to blockchain
- Returns: Both transaction signatures and statuses

**Important**: 
- This should NOT require a file upload
- Uses `asset_id` to reference the existing asset and its `document_hash`
- Generates NFT hash and Certificate hash on frontend, not backend

---

### 5. Get Transaction Status (ALREADY EXISTS - VERIFY)

**Endpoint**: `GET /api/blockchain/transaction/{transaction_id}/status`

**Response Should Include**:
```json
{
  "transaction_id": 5,
  "transaction_signature": "3a4b5c6d...",
  "status": "confirmed|pending|failed",
  "block_number": 199568402,
  "date_created": "2026-04-15T10:31:00",
  "date_confirmed": "2026-04-15T10:31:30",
  "data_hash": "nft_hash_value"
}
```

---

### 6. Retry Transaction (ALREADY EXISTS - VERIFY)

**Endpoint**: `POST /api/blockchain/transaction/{transaction_id}/retry`

**Works with**: Failed transactions  
**Returns**: Updated transaction status

---

### 7. Get Asset Transactions (ALREADY EXISTS - VERIFY)

**Endpoint**: `GET /api/blockchain/asset/{asset_id}/transactions`

**Response**:
```json
{
  "asset_id": 1,
  "transactions": [
    {
      "transaction_id": 5,
      "transaction_signature": "3a4b5c6d...",
      "transaction_type": "nft_mint|certificate_mint",
      "status": "confirmed|pending|failed",
      "data_hash": "nft_hash_value",
      "block_number": 199568402,
      "date_created": "2026-04-15T10:31:00",
      "date_confirmed": "2026-04-15T10:31:30"
    },
    {
      "transaction_id": 6,
      "transaction_signature": "7e8f9g0h...",
      "transaction_type": "certificate_mint",
      "status": "pending",
      "data_hash": "certificate_hash_value",
      "block_number": null,
      "date_created": "2026-04-15T10:31:05",
      "date_confirmed": null
    }
  ],
  "total_transactions": 2
}
```

---

## Database Schema Changes Required

### Assets Table
- ✅ `asset_id` (primary key)
- ✅ `user_id` (foreign key)
- ✅ `asset_title` (string)
- ✅ `ipfs_hash` (string)
- **ADD**: `document_hash` (string, VARCHAR 64) - SHA-256 hash of original file
- ✅ `version` (integer)
- ✅ `previous_asset_id` (integer, nullable)
- ✅ `date_created` (datetime)

### Transactions Table
- ✅ `transaction_id` (primary key)
- ✅ `asset_id` (foreign key)
- ✅ `transaction_signature` (string, VARCHAR 255)
- ✅ `transaction_type` (enum: 'nft_mint', 'certificate_mint')
- ✅ `status` (enum: 'pending', 'confirmed', 'failed')
- ✅ `data_hash` (string, VARCHAR 64) - hash that was minted
- ✅ `block_number` (integer, nullable)
- ✅ `date_created` (datetime)
- ✅ `date_confirmed` (datetime, nullable)

---

## API Call Sequence

### Flow 1: Asset Registration (Register IP Page)

1. **POST** `/api/ipfs/upload`
   - Send: File + asset title + version + previous_asset_id
   - Get: `asset_id`, `ipfs_hash`, `document_hash`
   - Backend generates & stores SHA-256 of file

2. **POST** `/api/blockchain/checkpoint-a/proof-of-originality` (Optional during registration)
   - Send: `asset_id`, `document_hash`
   - Get: Confirmation timestamp
   - (Can be deferred to later if needed)

---

### Flow 2: Asset Certification (Certify Asset Page)

1. **GET** `/api/ipfs/{asset_id}`
   - Get: Asset data including `document_hash`

2. Frontend generates:
   - `nft_hash` = SHA256(asset_id:document_hash)
   - `certificate_hash` = SHA256(user_id:nft_hash:timestamp)

3. **POST** `/api/blockchain/checkpoint-b/certify`
   - Send: `asset_id`, `nft_hash`, `certificate_hash`
   - Get: Both transaction signatures and IDs

4. **GET** `/api/blockchain/transaction/{nft_tx_id}/status` (Polling)
   - Repeat every 5 seconds until confirmed or failed

5. **GET** `/api/blockchain/transaction/{cert_tx_id}/status` (Polling)
   - Repeat every 5 seconds until confirmed or failed

6. **GET** `/api/blockchain/asset/{asset_id}/transactions`
   - Get: Full transaction history for display

---

## Important Notes

### ✅ What Frontend Does
- SHA-256 hashing (document, NFT, certificate)
- User interaction and UI
- Transaction polling and display
- Wallet connection

### ✅ What Backend Does
- File storage & IPFS upload
- SHA-256 generation during asset registration
- Blockchain interaction (submitting transactions)
- Transaction status polling (from Solana RPC)
- Database storage of hashes and transactions

### ⚠️ Critical Requirement
- **Document Hash** must be generated during asset registration and stored
- This same hash is used during certification
- Frontend retrieves it via GET `/api/ipfs/{asset_id}`
- Frontend should NOT ask for file re-upload during certification

---

## Testing Checklist

**Backend Testing**:
- [ ] Asset upload generates and returns document_hash
- [ ] GET asset returns document_hash
- [ ] Checkpoint A accepts document_hash from DB
- [ ] Checkpoint B accepts nft_hash and certificate_hash
- [ ] Transactions recorded with correct hashes
- [ ] Status polling returns accurate blockchain status
- [ ] Retry works for failed transactions
- [ ] Asset transaction history returns all related transactions

**Frontend Testing**:
- [ ] Asset registration stores document_hash
- [ ] Certification page retrieves asset with document_hash
- [ ] No file upload during certification
- [ ] NFT and Certificate hashes generated correctly
- [ ] Transactions displayed with blockchain links
- [ ] Transaction status updates in real-time
- [ ] Retry button works for failed transactions

---

## Summary

The blockchain integration requires the backend to:

1. **Store document hash** during asset registration (SHA-256 of uploaded file)
2. **Return document hash** when fetching asset details
3. **Accept pre-computed hashes** during certification (don't compute backend)
4. **Track transactions** with proper status and blockchain data
5. **Support polling** for transaction status updates

All other logic (hashing, wallet connection, UI) is frontend-only.

---

**Ready to implement?** This file can be passed to the backend Claude agent for implementation.
