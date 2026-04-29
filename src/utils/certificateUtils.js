import jsPDF from 'jspdf';
import CryptoJS from 'crypto-js';

/**
 * Generate certificate hash: SHA256(assetId:username:timestamp)
 * Combined from NFT ID, User, and Timestamp as requested
 */
export const generateCertificateHash = (assetId, username, timestamp = null) => {
  try {
    const ts = timestamp || new Date().toISOString();
    const combined = `${assetId}:${username}:${ts}`;
    const hash = CryptoJS.SHA256(combined).toString();
    return hash;
  } catch (error) {
    console.error('Error generating certificate hash:', error);
    throw new Error('Failed to generate certificate hash');
  }
};

/**
 * Generate PDF certificate with professional design
 * @param {Object} certificateData - Certificate information
 * @param {string} certificateData.assetName - Name of the asset
 * @param {string} certificateData.ownerName - Owner name
 * @param {string} certificateData.certificationDate - Certification date
 * @param {string} certificateData.transactionHash - Blockchain transaction hash
 * @param {string} certificateData.certificateHash - Certificate hash
 * @param {string} certificateData.message - Custom message/description
 * @returns {jsPDF} - PDF document instance
 */
export const generateCertificatePDF = (certificateData) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background color (light blue gradient effect with rectangle)
  pdf.setFillColor(240, 248, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  pdf.setDrawColor(25, 118, 210);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner decorative border
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(100, 150, 220);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Title
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(25, 118, 210);
  pdf.text('CERTIFICATE OF AUTHENTICITY', pageWidth / 2, 35, { align: 'center' });

  // Subtitle
  pdf.setFont('Helvetica', 'italic');
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Blockchain-Verified Asset Certificate', pageWidth / 2, 42, { align: 'center' });

  // Horizontal line
  pdf.setLineWidth(1);
  pdf.setDrawColor(25, 118, 210);
  pdf.line(25, 48, pageWidth - 25, 48);

  // Certificate content
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  let yPosition = 60;
  const lineHeight = 8;
  const labelFont = 'bold';
  const labelColor = [25, 118, 210];
  const valueColor = [50, 50, 50];

  // Helper function to add label-value pairs
  const addField = (label, value) => {
    pdf.setFont('Helvetica', labelFont);
    pdf.setTextColor(...labelColor);
    pdf.text(`${label}:`, 25, yPosition);

    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...valueColor);
    const maxWidth = pageWidth - 60;
    const lines = pdf.splitTextToSize(String(value), maxWidth);
    pdf.text(lines, 60, yPosition);

    yPosition += lineHeight * Math.max(lines.length, 1) + 2;
  };

  // Add certificate fields
  addField('Asset Name', certificateData.assetName || 'N/A');
  addField('Owner Name', certificateData.ownerName || 'N/A');
  addField('Certification Date', certificateData.certificationDate || 'N/A');

  yPosition += 3;

  // Transaction Hash
  addField('Transaction Hash', certificateData.transactionHash || 'N/A');

  // Certificate Hash
  addField('Certificate Hash', certificateData.certificateHash || 'N/A');

  // Custom message if provided
  if (certificateData.message) {
    yPosition += 2;
    addField('Description', certificateData.message);
  }

  // Footer with timestamp
  pdf.setFont('Helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  const footerText = `Generated on ${new Date().toLocaleString()}`;
  pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Blockchain badge
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(76, 175, 80);
  pdf.text('✓ Blockchain Verified', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return pdf;
};

/**
 * Generate Protected IP Certificate PDF
 * Certificate for the protected IP/document itself (after NFT certification)
 * @param {Object} certificateData - Certificate information
 * @param {string} certificateData.assetTitle - Title of the document/asset
 * @param {string} certificateData.submitterName - Name of the submitter/uploader
 * @param {string} certificateData.uploadedDate - Date when file was uploaded
 * @param {string} certificateData.certifiedDate - Date when file was certified/NFT minted
 * @param {string} certificateData.ipfsHash - IPFS hash/location
 * @param {string} certificateData.nftHash - NFT hash generated during certification
 * @param {string} certificateData.transactionId - Blockchain transaction ID
 * @param {string} certificateData.blockNumber - Block number where transaction was recorded
 * @param {string} certificateData.walletAddress - Project owner's wallet public key
 * @param {string} certificateData.certificateId - Certificate ID (hash generated during certification)
 * @returns {jsPDF} - PDF document instance
 */
export const generateProtectedIPCertificatePDF = (certificateData) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background color
  pdf.setFillColor(240, 248, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  pdf.setDrawColor(25, 118, 210);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner decorative border
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(100, 150, 220);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Title
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(36);
  pdf.setTextColor(25, 118, 210);
  pdf.text('CERTIFICATE', pageWidth / 2, 35, { align: 'center' });

  // Horizontal line
  pdf.setLineWidth(1);
  pdf.setDrawColor(25, 118, 210);
  pdf.line(25, 42, pageWidth - 25, 42);

  // Statement section
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  let yPosition = 52;
  const lineHeight = 6;
  const maxWidth = pageWidth - 50;

  // Certificate statement
  const statement = `This is to certify that the file referred hereunder existed and was presented on the date and time encoded to iClaim by the entity identified as ${certificateData.submitterName || 'the registered user'}.`;

  const statementLines = pdf.splitTextToSize(statement, maxWidth);
  pdf.text(statementLines, 25, yPosition);
  yPosition += lineHeight * statementLines.length + 5;

  // Helper function to add label-value pairs
  const addField = (label, value) => {
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    pdf.setFontSize(9);
    pdf.text(`${label}:`, 25, yPosition);

    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(String(value || 'N/A'), maxWidth - 40);
    pdf.text(lines, 65, yPosition);

    yPosition += lineHeight * Math.max(lines.length, 1) + 2;
  };

  // Document Information Section
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(25, 118, 210);
  pdf.text('DOCUMENT INFORMATION', 25, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(25, yPosition, pageWidth - 25, yPosition);
  yPosition += 3;

  addField('Document Title', certificateData.assetTitle);
  addField('Submitter Name', certificateData.submitterName);
  addField('Uploaded At', certificateData.uploadedDate);
  addField('Certified At', certificateData.certifiedDate);

  // IPFS & Blockchain Information Section
  yPosition += 2;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(25, 118, 210);
  pdf.text('BLOCKCHAIN & STORAGE INFORMATION', 25, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(25, yPosition, pageWidth - 25, yPosition);
  yPosition += 3;

  addField('Project IPFS Location', certificateData.ipfsHash);
  addField('NFT Hash', certificateData.nftHash);
  addField('Transaction ID', certificateData.transactionId);
  addField('Block Number', certificateData.blockNumber);

  // Security & Verification Section
  yPosition += 2;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(25, 118, 210);
  pdf.text('SECURITY & VERIFICATION', 25, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(25, yPosition, pageWidth - 25, yPosition);
  yPosition += 3;

  addField('Project Owner Public Key', certificateData.walletAddress);
  addField('Certificate ID', certificateData.certificateId);

  // Footer with timestamp
  pdf.setFont('Helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  const footerText = `Generated on ${new Date().toLocaleString()}`;
  pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Blockchain badge
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(76, 175, 80);
  pdf.text('✓ Blockchain Verified Certificate', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return pdf;
};

/**
 * Download certificate PDF
 * @param {jsPDF} pdf - PDF document instance
 * @param {string} filename - Name for the downloaded file
 */
export const downloadCertificatePDF = (pdf, filename = 'certificate.pdf') => {
  pdf.save(filename);
};

/**
 * Format transaction hash for display (shortened version)
 * @param {string} hash - Full hash
 * @param {number} displayLength - Number of characters to show
 * @returns {string} - Formatted hash
 */
export const formatHashForDisplay = (hash, displayLength = 16) => {
  if (!hash) return 'N/A';
  if (hash.length <= displayLength * 2 + 3) return hash;
  return `${hash.substring(0, displayLength)}...${hash.substring(hash.length - displayLength)}`;
};
