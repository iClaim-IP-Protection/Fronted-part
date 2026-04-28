# Integration Checklist for Developers

## ✅ Pre-Integration Setup

- [x] BlockchainContext is already added to App.jsx
- [x] All services are created and exported
- [x] All components are created with CSS files
- [x] Documentation is complete

**Status**: ✅ No setup needed - ready to import and use!

---

## 🔧 Integration Steps by Page

### Page 1: Asset Certification Flow

**File**: `src/pages/AssetCertification.jsx` (or similar)

**Checklist**:
- [ ] Import `UploadDocumentForm` component
- [ ] Import `CertifyAssetForm` component
- [ ] Create state for `documentHash` and `proofRecorded`
- [ ] Conditionally render UploadDocumentForm or CertifyAssetForm
- [ ] Pass `assetId` to both components
- [ ] Test complete flow (upload → record → certify)
- [ ] Test error handling
- [ ] Test localStorage persistence

**Code Template**:
```jsx
import { useState } from 'react';
import UploadDocumentForm from '../components/UploadDocumentForm';
import CertifyAssetForm from '../components/CertifyAssetForm';

export default function AssetCertification() {
  const { assetId } = useParams();
  const [documentHash, setDocumentHash] = useState(null);

  return (
    <>
      {!documentHash ? (
        <UploadDocumentForm 
          assetId={assetId}
          onSuccess={(data) => setDocumentHash(data.documentHash)}
        />
      ) : (
        <CertifyAssetForm assetId={assetId} documentHash={documentHash} />
      )}
    </>
  );
}
```

---

### Page 2: Asset Information/Details

**File**: `src/pages/AssetInfo.jsx` (or similar)

**Checklist**:
- [ ] Import `TransactionHistoryView` component
- [ ] Add section to display transaction history
- [ ] Pass `assetId` prop
- [ ] Test loading state
- [ ] Test empty state (no transactions yet)
- [ ] Test with multiple transactions
- [ ] Test refresh functionality
- [ ] Test retry on failed transactions
- [ ] Test Solana Explorer links

**Code Template**:
```jsx
import TransactionHistoryView from '../components/TransactionHistoryView';

export default function AssetInfo() {
  const { assetId } = useParams();

  return (
    <div className="asset-info">
      <h1>Asset Details</h1>
      {/* ... other asset info ... */}
      <TransactionHistoryView assetId={assetId} />
    </div>
  );
}
```

---

### Page 3: Dashboard/Asset List

**File**: `src/pages/Dashboard.jsx` (optional)

**Checklist**:
- [ ] Consider adding certification status indicator to asset cards
- [ ] Show "Not Certified" / "Pending" / "Certified" badge
- [ ] Link to certification page
- [ ] Show recent transaction status
- [ ] Test badge display with different statuses

**Code Template**:
```jsx
import StatusBadge from '../components/StatusBadge';

function AssetCard({ asset, certificationStatus }) {
  return (
    <div className="asset-card">
      <h3>{asset.name}</h3>
      <StatusBadge status={certificationStatus} />
      <button onClick={() => navigate(`/assets/${asset.id}/certify`)}>
        Certify Asset
      </button>
    </div>
  );
}
```

---

### Page 4: Profile/Settings

**File**: `src/pages/MyProfile.jsx` (optional)

**Checklist**:
- [ ] Show user's certification stats
- [ ] Display total assets
- [ ] Display certified assets count
- [ ] Display pending certifications
- [ ] Add link to view all transaction history

---

## 🧪 Testing Checklist

### Complete Happy Path
- [ ] Create new asset
- [ ] View asset details
- [ ] Click "Certify"
- [ ] Upload document
- [ ] Record proof of originality (Checkpoint A)
- [ ] Connect Phantom wallet
- [ ] Certify asset (Checkpoint B)
- [ ] Watch transactions update from PENDING to CONFIRMED
- [ ] View transaction on Solana Explorer
- [ ] View transaction history
- [ ] Copy transaction signature
- [ ] Refresh page - data persists

### Error Scenarios
- [ ] Upload oversized file (>50MB) → Error message
- [ ] Try to certify without document → Error message
- [ ] Disconnect wallet during certification → Error message
- [ ] Network error during polling → Error message
- [ ] Retry failed transaction → Success
- [ ] Invalid file upload → Error handling

### Edge Cases
- [ ] Upload same document twice
- [ ] Certify before document upload completes
- [ ] Close page before certification completes
- [ ] Multiple rapid retry attempts
- [ ] Browser tab becomes inactive during polling

### Mobile Testing
- [ ] Touch interaction on file upload
- [ ] Keyboard navigation (accessibility)
- [ ] Responsive layout on mobile
- [ ] Touch-friendly button sizes

---

## 📊 API Verification

Before integrating, verify backend is running:

```bash
# Test endpoint availability
curl http://localhost:8000/api/blockchain/checkpoint-a/proof-of-originality

# Should return appropriate error (400 Bad Request) if not payload
# NOT 404 (endpoint exists)
```

**Checklist**:
- [ ] Backend running on localhost:8000
- [ ] All 5 endpoints responding
- [ ] Authentication working (JWT token)
- [ ] CORS enabled
- [ ] Database migrations complete

---

## 🎨 Styling Customization

If you need to customize colors/styling:

**Files to Modify**:
- `src/components/UploadDocumentForm.css`
- `src/components/CertifyAssetForm.css`
- `src/components/TransactionHistoryView.css`
- `src/components/StatusBadge.css`

**Color Variables** (in CSS):
- Success: `#4CAF50` (Green)
- Pending: `#FFA500` (Orange)
- Failed: `#F44336` (Red)
- Primary: `#2196F3` (Blue)

**Checklist**:
- [ ] Review default colors
- [ ] Update if needed for brand consistency
- [ ] Test dark mode (if applicable)
- [ ] Verify contrast ratios (accessibility)

---

## 📱 Responsiveness Testing

Test on these breakpoints:

- [ ] Desktop (1920px)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (480px)
- [ ] Small mobile (320px)

All components include media queries for responsiveness.

---

## ♿ Accessibility Checklist

- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Color not only indicator (text + icon)
- [ ] Sufficient contrast ratios
- [ ] Focus states visible
- [ ] Error messages announced

All components follow WCAG 2.1 AA guidelines.

---

## 📝 Documentation to Review

Before implementing, read:

1. **IMPLEMENTATION_SUMMARY.md** - Overview (5 min read)
2. **QUICK_START.md** - Setup guide (10 min read)
3. **BLOCKCHAIN_INTEGRATION.md** - Complete doc (15 min read)

---

## 🔗 Import References

### Common Imports

```jsx
// Components
import UploadDocumentForm from '../components/UploadDocumentForm';
import CertifyAssetForm from '../components/CertifyAssetForm';
import TransactionHistoryView from '../components/TransactionHistoryView';
import StatusBadge from '../components/StatusBadge';

// Hooks
import { useBlockchain } from '../context/BlockchainContext';
import { useWallet } from '../context/WalletContext';

// Services
import { blockchainAPI, hashingUtilities, blockchainUtils } from '../services/blockchainService';
import { pollSingleTransaction, createContinuousPoller } from '../services/transactionPolling';

// API
import { authAPI, assetsAPI } from '../services/api';
```

---

## 🐛 Debugging Tips

### Enable Console Logging
Most components log to console in development. Check browser console for:
- Hash generation progress
- API call results
- Status updates
- Error details

### Common Console Messages
```
✅ Wallet auto-loaded from backend: 0x123...
📝 Recording proof of originality...
🔄 Polling transaction: tx_123
✅ Transaction confirmed on blockchain
❌ Transaction failed with error: ...
```

### LocalStorage Inspection
```javascript
// In browser console
localStorage.getItem('proof_1')
localStorage.getItem('certification_1')
localStorage.getItem('jwt_token')
```

### Network Tab Inspection
- Check API calls reach backend
- Verify JWT token in Authorization header
- Check response status codes
- Monitor request/response payloads

---

## 📞 Support Resources

### If Something Breaks:

1. **Check Console**: Browser DevTools → Console tab
2. **Check Network**: Browser DevTools → Network tab
3. **Check localStorage**: Browser DevTools → Application → localStorage
4. **Read Docs**: Check BLOCKCHAIN_INTEGRATION.md

### Common Issues:

- **"useContext error"**: Missing BlockchainProvider in App.jsx
- **"Hash generation fails"**: Browser doesn't support Web Crypto API
- **"API not responding"**: Backend not running on localhost:8000
- **"Wallet not connecting"**: Phantom wallet not installed/configured

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All components integrated
- [ ] Full testing complete
- [ ] Error handling verified
- [ ] Responsive design tested
- [ ] Accessibility checked
- [ ] localStorage working
- [ ] API endpoints stable
- [ ] Documentation reviewed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backend migrations complete
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] HTTPS enabled (for clipboard API)
- [ ] Rate limiting configured

---

## 🚀 Deployment Notes

### Frontend
- Build: `npm run build` (or your build command)
- Test build: `npm run preview`
- Deploy to hosting service

### Backend
- Ensure devnet RPC endpoint accessible
- Verify all database migrations run
- Check Solana program IDs correct
- Test transaction endpoints

### Verification After Deploy
- [ ] Components load
- [ ] Forms work
- [ ] API calls succeed
- [ ] Transactions proceed
- [ ] Polling updates UI
- [ ] localStorage persists
- [ ] No console errors

---

## 📋 Final Verification

**Before considering integration complete**:

- [ ] Components render without errors
- [ ] Forms submit and update state
- [ ] API calls return expected responses
- [ ] Polling updates UI in real-time
- [ ] Errors display user-friendly messages
- [ ] Success states show confirmations
- [ ] Data persists across refreshes
- [ ] Mobile experience is good
- [ ] All documentation reviewed
- [ ] Team is trained on new features

---

**Good luck with integration! 🎉**

Last updated: April 15, 2026
