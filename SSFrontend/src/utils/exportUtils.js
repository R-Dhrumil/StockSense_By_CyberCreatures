// ============================================================================
// StockSense Enterprise Export Engine
// Client-side & Backend-integrated PDF and Excel (.xlsx) Generation
// ZERO External Dependencies • Native Vector PDF (PDF 1.4) & SpreadsheetML
// ============================================================================

/**
 * Trigger immediate browser file download from Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);
};

/**
 * Escape text for PDF text strings
 */
const escapePdfText = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // ASCII printable for Type 1 fonts
};

/**
 * Pure JavaScript Vector PDF Generator (PDF 1.4 Standard)
 * Generates beautifully styled, multi-page vector PDF reports
 */
export const generateClientPdf = ({
  title = 'StockSense Analytics Report',
  subtitle = 'Enterprise Operational Intelligence',
  columns = [],
  data = [],
  summaryCards = [],
  filename = 'StockSense_Report.pdf'
}) => {
  const pageWidth = 595.28; // A4 point width
  const pageHeight = 841.89; // A4 point height
  const marginLeft = 36;
  const marginRight = 36;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Compute column widths
  const colCount = Math.max(columns.length, 1);
  const colWidth = contentWidth / colCount;

  // Split rows across pages
  const rowsPerPage = 26;
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const pages = [];

  for (let p = 0; p < totalPages; p++) {
    const isFirstPage = p === 0;
    const pageRows = data.slice(p * rowsPerPage, (p + 1) * rowsPerPage);

    let stream = '';

    // Header Background Accent Bar
    stream += `0.91 0.54 0.31 rg 0 826 ${pageWidth} 16 re f\n`; // Brand orange line at top

    let y = 800;

    if (isFirstPage) {
      // Company brand title
      stream += `BT /F2 18 Tf 0.12 0.16 0.22 rg ${marginLeft} ${y} Td (${escapePdfText(title)}) Tj ET\n`;
      y -= 18;

      // Subtitle & Metadata
      const meta = `${subtitle} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Scope: Active Facility`;
      stream += `BT /F1 9 Tf 0.42 0.45 0.50 rg ${marginLeft} ${y} Td (${escapePdfText(meta)}) Tj ET\n`;
      y -= 14;

      // Divider line
      stream += `0.85 0.88 0.91 RG 1 w ${marginLeft} ${y} m ${pageWidth - marginRight} ${y} l S\n`;
      y -= 16;

      // Summary KPI Cards (if present)
      if (summaryCards && summaryCards.length > 0) {
        const cardWidth = (contentWidth - (summaryCards.length - 1) * 8) / summaryCards.length;
        const cardHeight = 38;
        
        summaryCards.forEach((c, idx) => {
          const cx = marginLeft + idx * (cardWidth + 8);
          // Card Box background
          stream += `0.97 0.98 0.99 rg ${cx} ${y - cardHeight} ${cardWidth} ${cardHeight} re f\n`;
          stream += `0.85 0.88 0.91 RG 0.5 w ${cx} ${y - cardHeight} ${cardWidth} ${cardHeight} re S\n`;
          
          // Card Title
          stream += `BT /F1 7.5 Tf 0.45 0.48 0.53 rg ${cx + 8} ${y - 12} Td (${escapePdfText(c.title || '')}) Tj ET\n`;
          // Card Value
          stream += `BT /F2 12 Tf 0.10 0.13 0.18 rg ${cx + 8} ${y - 28} Td (${escapePdfText(c.value || '')}) Tj ET\n`;
        });
        y -= (cardHeight + 16);
      }
    } else {
      // Continuation Header
      stream += `BT /F2 11 Tf 0.12 0.16 0.22 rg ${marginLeft} ${y} Td (${escapePdfText(title)} - Continued) Tj ET\n`;
      y -= 14;
      stream += `0.85 0.88 0.91 RG 0.5 w ${marginLeft} ${y} m ${pageWidth - marginRight} ${y} l S\n`;
      y -= 14;
    }

    // Table Header Row
    const headerHeight = 22;
    stream += `0.15 0.20 0.28 rg ${marginLeft} ${y - headerHeight} ${contentWidth} ${headerHeight} re f\n`;
    
    columns.forEach((col, idx) => {
      const cx = marginLeft + idx * colWidth + 6;
      const headerText = escapePdfText(col.header || col.label || `Col ${idx + 1}`);
      stream += `BT /F2 8.5 Tf 1 1 1 rg ${cx} ${y - 15} Td (${headerText}) Tj ET\n`;
    });
    y -= headerHeight;

    // Table Rows
    const rowHeight = 18;
    pageRows.forEach((row, rowIdx) => {
      // Zebra striping
      if (rowIdx % 2 === 1) {
        stream += `0.97 0.98 0.99 rg ${marginLeft} ${y - rowHeight} ${contentWidth} ${rowHeight} re f\n`;
      }

      // Bottom Row border
      stream += `0.90 0.92 0.94 RG 0.5 w ${marginLeft} ${y - rowHeight} m ${pageWidth - marginRight} ${y - rowHeight} l S\n`;

      // Cell texts
      columns.forEach((col, colIdx) => {
        const cx = marginLeft + colIdx * colWidth + 6;
        const key = col.accessor || col.property || col.key || '';
        let val = key ? row[key] : (row[colIdx] ?? '');
        if (typeof val === 'number') {
          val = val.toLocaleString();
        }
        val = escapePdfText(val !== undefined && val !== null ? String(val) : '');
        // Trim if too long
        if (val.length > 28) val = val.substring(0, 25) + '...';

        stream += `BT /F1 8 Tf 0.18 0.20 0.25 rg ${cx} ${y - 12} Td (${val}) Tj ET\n`;
      });

      y -= rowHeight;
    });

    // Page Footer
    const footerText = `StockSense IMS • Confidential Internal Document • Page ${p + 1} of ${totalPages}`;
    stream += `BT /F1 8 Tf 0.55 0.58 0.62 rg ${marginLeft} 25 Td (${escapePdfText(footerText)}) Tj ET\n`;

    pages.push(stream);
  }

  // Construct PDF Objects
  let objects = [];
  let offsets = [];

  const addObj = (str) => {
    objects.push(str);
  };

  // Obj 1: Catalog
  addObj(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Obj 2: Pages
  const pageRefs = pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ');
  addObj(`2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>\nendobj\n`);

  // Obj 3: Font Helvetica
  addObj(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);

  // Obj 4: Font Helvetica-Bold
  addObj(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);

  // Generate Page & Content stream objects
  pages.forEach((streamContent, idx) => {
    const pageObjNum = 5 + idx * 2;
    const streamObjNum = 6 + idx * 2;

    addObj(`${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObjNum} 0 R >>\nendobj\n`);

    const streamLen = new TextEncoder().encode(streamContent).length;
    addObj(`${streamObjNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}endstream\nendobj\n`);
  });

  // Calculate Byte Offsets
  let pdf = '%PDF-1.4\n';
  offsets.push(0);

  objects.forEach((obj) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += obj;
  });

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  downloadBlob(blob, finalFilename);
  return true;
};

/**
 * Pure JavaScript Excel XML (.xlsx / .xml) Generator
 * Generates fully styled native Excel spreadsheets without third-party dependencies
 */
export const generateClientExcel = ({
  title = 'StockSense Report',
  sheetName = 'Analytics',
  columns = [],
  data = [],
  filename = 'StockSense_Report.xlsx'
}) => {
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#111827"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaStyle">
   <Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#6B7280"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="RowEven">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="RowOdd">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName.replace(/[\\/*?:[\]]/g, '')}">
  <Table ss:DefaultRowHeight="20">
   <Row ss:Height="28">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${title}</Data></Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:StyleID="MetaStyle"><Data ss:Type="String">Generated: ${new Date().toLocaleString()} | StockSense Operational Intelligence</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="24">
`;

  // Header Cells
  columns.forEach((col) => {
    const label = col.header || col.label || 'Field';
    xml += `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(label)}</Data></Cell>\n`;
  });

  xml += `   </Row>\n`;

  // Data Rows
  data.forEach((row, rowIdx) => {
    const styleId = rowIdx % 2 === 0 ? 'RowEven' : 'RowOdd';
    xml += `   <Row ss:StyleID="${styleId}">\n`;

    columns.forEach((col) => {
      const key = col.accessor || col.property || col.key || '';
      let val = key ? row[key] : (row[col] ?? '');
      
      const isNum = typeof val === 'number';
      const type = isNum ? 'Number' : 'String';
      const cleanVal = isNum ? val : escapeXml(val !== undefined && val !== null ? String(val) : '');

      xml += `    <Cell><Data ss:Type="${type}">${cleanVal}</Data></Cell>\n`;
    });

    xml += `   </Row>\n`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
  });
  downloadBlob(blob, finalFilename);
  return true;
};

const escapeXml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Universal PDF Report Downloader
 * Attempts backend download first, seamlessly falls back to client vector PDF
 */
export const downloadPdfReport = async ({
  title = 'StockSense Analytics Report',
  subtitle = 'Enterprise Operational Intelligence',
  columns = [],
  data = [],
  summaryCards = [],
  filename = 'StockSense_Report.pdf',
  apiType = null
}) => {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Try backend pre-defined endpoint if apiType provided
  if (apiType) {
    try {
      const res = await fetch(`/api/v1/export/reports/${apiType}?format=pdf`);
      if (res.ok) {
        const blob = await res.blob();
        downloadBlob(blob, safeFilename);
        return true;
      }
    } catch {
      // Fallback to client-side
    }
  }

  // Try backend custom export endpoint
  try {
    const headers = columns.map(c => ({
      label: c.header || c.label || 'Field',
      property: c.accessor || c.property || c.key || 'value'
    }));

    const res = await fetch('/api/v1/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        subtitle,
        headers,
        data,
        filename: safeFilename
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      downloadBlob(blob, safeFilename);
      return true;
    }
  } catch {
    // Backend unreachable, fallback to client PDF
  }

  // Client-side fallback
  return generateClientPdf({ title, subtitle, columns, data, summaryCards, filename: safeFilename });
};

/**
 * Universal Excel Report Downloader
 * Attempts backend ExcelJS endpoint first, seamlessly falls back to client SpreadsheetML
 */
export const downloadExcelReport = async ({
  title = 'StockSense Analytics Report',
  sheetName = 'Analytics',
  columns = [],
  data = [],
  filename = 'StockSense_Report.xlsx',
  apiType = null
}) => {
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // Try backend pre-defined endpoint if apiType provided
  if (apiType) {
    try {
      const res = await fetch(`/api/v1/export/reports/${apiType}?format=excel`);
      if (res.ok) {
        const blob = await res.blob();
        downloadBlob(blob, safeFilename);
        return true;
      }
    } catch {
      // Fallback to client-side
    }
  }

  // Try backend custom export endpoint
  try {
    const cols = columns.map(c => ({
      header: c.header || c.label || 'Field',
      key: c.accessor || c.property || c.key || 'value',
      width: 18
    }));

    const res = await fetch('/api/v1/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: safeFilename,
        sheetName,
        columns: cols,
        data
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      downloadBlob(blob, safeFilename);
      return true;
    }
  } catch {
    // Backend unreachable, fallback to client Excel
  }

  // Client-side fallback
  return generateClientExcel({ title, sheetName, columns, data, filename: safeFilename });
};
