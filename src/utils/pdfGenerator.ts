/**
 * Generates a valid client-side minimal PDF template representing the resume
 * and triggers a download in the browser.
 */
export const downloadMockPDF = (roleId: string, roleTitle: string) => {
  const pdfTemplate = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 250 >>
stream
BT
/F1 22 Tf
70 700 Td
(PRANIL BELGE) Tj
/F1 14 Tf
0 -35 Td
(${roleTitle.toUpperCase()} RESUME) Tj
/F1 11 Tf
0 -30 Td
(Generated dynamically via Personal Career Portfolio Platform.) Tj
0 -20 Td
(This is a template placeholder resume for your selected role.) Tj
0 -35 Td
(HOW TO REPLACE THIS FILE:) Tj
0 -20 Td
(1. Go to the Admin Panel: /admin) Tj
0 -15 Td
(2. Login with password (default: admin)) Tj
0 -15 Td
(3. Navigate to the Resumes tab and upload your real PDF resume.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000227 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
397
%%EOF`;

  const blob = new Blob([pdfTemplate], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Pranil_Belge_${roleId.replace(/-/g, '_')}_Resume.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
