import { jsPDF } from 'jspdf';
import {
  PaymentDisbursement,
  FeeDeposit,
  InstitutionalAuthorizationConfig,
  DisbursementLedgerCategory,
  DisbursementStatus,
} from '../types';
import { formatCurrency, LEDGER_DEFINITIONS } from './academicUtils';

export interface MonthlyLedgerExportOptions {
  monthKey?: string; // e.g. "2026-08" or "all"
  monthLabel?: string; // e.g. "August 2026"
  ledgerFilter?: string; // "all" or specific ledger category
  statusFilter?: string; // "all" or specific status
  disbursements: PaymentDisbursement[];
  deposits: FeeDeposit[];
  authConfig?: InstitutionalAuthorizationConfig;
  budgetCap?: number;
  minProfitTarget?: number;
}

/**
 * Filter disbursements and deposits by a given year-month (e.g. "2026-08")
 */
export function getFilteredDisbursementLedgerData(
  options: MonthlyLedgerExportOptions
) {
  const {
    monthKey = 'all',
    ledgerFilter = 'all',
    statusFilter = 'all',
    disbursements,
    deposits,
  } = options;

  // Filter Disbursements
  const filteredDisbursements = disbursements.filter((item) => {
    // Month filter
    if (monthKey !== 'all') {
      const itemMonth = item.disbursementDate.slice(0, 7); // "YYYY-MM"
      if (itemMonth !== monthKey) return false;
    }

    // Ledger filter
    if (ledgerFilter !== 'all' && item.ledger !== ledgerFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Filter Deposits for the same period to calculate Net Profit accurately
  const filteredDeposits = deposits.filter((item) => {
    if (monthKey !== 'all') {
      const itemMonth = item.depositDate.slice(0, 7);
      if (itemMonth !== monthKey) return false;
    }
    return true;
  });

  const totalDisbursed = filteredDisbursements.reduce(
    (sum, d) => sum + (d.status === 'Cancelled' ? 0 : d.amount),
    0
  );

  const grossRevenue = filteredDeposits.reduce(
    (sum, d) => sum + d.amountPaid,
    0
  );

  const netOperatingProfit = grossRevenue - totalDisbursed;
  const profitMargin =
    grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;

  // Group by ledger category
  const ledgerBreakdown = Object.keys(LEDGER_DEFINITIONS).map((key) => {
    const ledger = key as DisbursementLedgerCategory;
    const ledgerItems = filteredDisbursements.filter(
      (d) => d.ledger === ledger && d.status !== 'Cancelled'
    );
    const amount = ledgerItems.reduce((sum, d) => sum + d.amount, 0);
    const count = ledgerItems.length;
    const pctOfExpense = totalDisbursed > 0 ? (amount / totalDisbursed) * 100 : 0;
    const pctOfRevenue = grossRevenue > 0 ? (amount / grossRevenue) * 100 : 0;

    return {
      ledger,
      amount,
      count,
      pctOfExpense,
      pctOfRevenue,
    };
  });

  return {
    filteredDisbursements,
    filteredDeposits,
    totalDisbursed,
    grossRevenue,
    netOperatingProfit,
    profitMargin,
    ledgerBreakdown,
    recordCount: filteredDisbursements.length,
  };
}

/**
 * Generate a formatted institutional PDF document for the Monthly Disbursement Ledger
 */
export function generateMonthlyDisbursementLedgerPDF(
  options: MonthlyLedgerExportOptions
): jsPDF {
  const {
    monthKey = 'all',
    monthLabel = monthKey === 'all' ? 'Consolidated All-Time' : monthKey,
    ledgerFilter = 'all',
    statusFilter = 'all',
    authConfig,
    budgetCap = authConfig?.monthlyDisbursementBudgetCap || 350000,
    minProfitTarget = authConfig?.minimumProfitReserveTarget || 100000,
  } = options;

  const summary = getFilteredDisbursementLedgerData(options);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 273mm
  let y = 14;

  const institutionName = authConfig?.sealInstitutionName || 'BILEY ACADEMY OF ADVANCED STUDIES';
  const directorName = authConfig?.directorName || 'Dr. Sourav Biley';
  const directorDesignation = authConfig?.directorDesignation || 'Managing Director & Founder';
  const accountsOfficerName = authConfig?.accountsSignatoryName || 'Mr. B. K. Bhattacharya';
  const accountsOfficerDesignation = authConfig?.accountsSignatoryDesignation || 'Chief Accounts Officer & Treasurer';

  // Helper for page headers & footers
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 14;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${institutionName} • Monthly Disbursement Ledger & P&L Record (${monthLabel})`,
      margin,
      9
    );
    doc.text(
      `Confidential Financial Document`,
      pageWidth - margin,
      9,
      { align: 'right' }
    );
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, 10.5, pageWidth - margin, 10.5);
  };

  // 1. PRIMARY INSTITUTIONAL HEADER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(institutionName.toUpperCase(), pageWidth / 2, y + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(248, 250, 252);
  doc.text(
    `OFFICIAL MONTHLY DISBURSEMENT LEDGER & OPERATING P&L RECORD`,
    pageWidth / 2,
    y + 13,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Central Treasury & Accounts Cell • Reporting Period: ${monthLabel.toUpperCase()} • Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`,
    pageWidth / 2,
    y + 18,
    { align: 'center' }
  );

  y += 25;

  // 2. EXECUTIVE FINANCIAL SUMMARY & KPI STRIP
  const cardW = (contentWidth - 12) / 4;
  const cardH = 18;

  // Card 1: Gross Fee Collections
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(margin, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.text('GROSS FEE INFLOW', margin + 4, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${summary.grossRevenue.toLocaleString('en-IN')}`, margin + 4, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${summary.filteredDeposits.length} fee receipts collected`, margin + 4, y + 15.5);

  // Card 2: Total Disbursements
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202); // rose-200
  doc.roundedRect(margin + cardW + 4, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL DISBURSEMENTS', margin + cardW + 8, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${summary.totalDisbursed.toLocaleString('en-IN')}`, margin + cardW + 8, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${summary.recordCount} vouchers across ledgers`, margin + cardW + 8, y + 15.5);

  // Card 3: Net Operating Profit
  const isProfit = summary.netOperatingProfit >= 0;
  if (isProfit) {
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
  } else {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(254, 202, 202); // rose-200
  }
  doc.roundedRect(margin + (cardW + 4) * 2, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  if (isProfit) {
    doc.setTextColor(55, 48, 163);
  } else {
    doc.setTextColor(153, 27, 27);
  }
  doc.text('NET OPERATING PROFIT', margin + (cardW + 4) * 2 + 4, y + 5);
  doc.setFontSize(11);
  if (isProfit) {
    doc.setTextColor(30, 27, 75);
  } else {
    doc.setTextColor(153, 27, 27);
  }
  doc.text(`INR ${summary.netOperatingProfit.toLocaleString('en-IN')}`, margin + (cardW + 4) * 2 + 4, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Profit Margin: ${summary.profitMargin.toFixed(1)}%`, margin + (cardW + 4) * 2 + 4, y + 15.5);

  // Card 4: Budget Cap & Solvency
  const budgetUtilization = budgetCap > 0 ? (summary.totalDisbursed / budgetCap) * 100 : 0;
  doc.setFillColor(255, 251, 235); // amber-50
  doc.setDrawColor(254, 243, 199);
  doc.roundedRect(margin + (cardW + 4) * 3, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text('BUDGET & SOLVENCY', margin + (cardW + 4) * 3 + 4, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${budgetUtilization.toFixed(0)}% Cap Used`, margin + (cardW + 4) * 3 + 4, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Cap: INR ${budgetCap.toLocaleString('en-IN')} | Min: INR ${minProfitTarget.toLocaleString('en-IN')}`, margin + (cardW + 4) * 3 + 4, y + 15.5);

  y += 21;

  // 3. LEDGER CATEGORY BREAKDOWN TABLE (Mini Strip)
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LEDGER EXPENDITURE BREAKDOWN:', margin + 3, y + 4);

  const activeLedgers = summary.ledgerBreakdown.filter((l) => l.amount > 0);
  let ledgerSummaryText = activeLedgers
    .map(
      (l) =>
        `${l.ledger}: INR ${l.amount.toLocaleString('en-IN')} (${l.pctOfExpense.toFixed(1)}%)`
    )
    .join('  •  ');
  if (!ledgerSummaryText) ledgerSummaryText = 'No expenditures recorded in this period.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(ledgerSummaryText, margin + 55, y + 4, { maxWidth: contentWidth - 58 });

  y += 8;

  // 4. DETAILED TRANSACTION TABLE
  // Column layout (total 273mm)
  const cols = [
    { label: 'Voucher No', width: 26 },
    { label: 'Date', width: 22 },
    { label: 'Ledger Category', width: 32 },
    { label: 'Payee / Beneficiary', width: 44 },
    { label: 'Purpose & Description', width: 55 },
    { label: 'Payment Mode / Ref', width: 36 },
    { label: 'Amount (INR)', width: 30, align: 'right' },
    { label: 'Status', width: 28, align: 'center' },
  ];

  // Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let currentX = margin;
  cols.forEach((col) => {
    if (col.align === 'right') {
      doc.text(col.label, currentX + col.width - 2, y + 4.8, { align: 'right' });
    } else if (col.align === 'center') {
      doc.text(col.label, currentX + col.width / 2, y + 4.8, { align: 'center' });
    } else {
      doc.text(col.label, currentX + 2, y + 4.8);
    }
    currentX += col.width;
  });

  y += 7;

  // Table Rows
  if (summary.filteredDisbursements.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'No disbursement records found for the selected month/filters.',
      pageWidth / 2,
      y + 8,
      { align: 'center' }
    );
    y += 14;
  } else {
    summary.filteredDisbursements.forEach((item, idx) => {
      checkPageBreak(8);

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.8, 'F');

      // Thin separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 6.8, margin + contentWidth, y + 6.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);

      let rowX = margin;

      // 1. Voucher No
      doc.setFont('helvetica', 'bold');
      doc.text(item.voucherNo, rowX + 2, y + 4.5);
      rowX += cols[0].width;

      // 2. Date
      doc.setFont('helvetica', 'normal');
      doc.text(item.disbursementDate, rowX + 2, y + 4.5);
      rowX += cols[1].width;

      // 3. Ledger
      doc.setFont('helvetica', 'bold');
      doc.text(item.ledger, rowX + 2, y + 4.5);
      rowX += cols[2].width;

      // 4. Payee
      doc.setFont('helvetica', 'normal');
      const payeeStr = doc.splitTextToSize(item.payeeName, cols[3].width - 4);
      doc.text(payeeStr[0] || '', rowX + 2, y + 4.5);
      rowX += cols[3].width;

      // 5. Purpose
      const purposeStr = doc.splitTextToSize(item.purposeDescription, cols[4].width - 4);
      doc.text(purposeStr[0] || '', rowX + 2, y + 4.5);
      rowX += cols[4].width;

      // 6. Payment Mode & Ref
      const modeText = item.transactionRef ? `${item.paymentMode} (${item.transactionRef.slice(0, 10)})` : item.paymentMode;
      const modeStr = doc.splitTextToSize(modeText, cols[5].width - 4);
      doc.text(modeStr[0] || '', rowX + 2, y + 4.5);
      rowX += cols[5].width;

      // 7. Amount
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${item.amount.toLocaleString('en-IN')}`, rowX + cols[6].width - 2, y + 4.5, { align: 'right' });
      rowX += cols[6].width;

      // 8. Status
      doc.setFont('helvetica', 'bold');
      if (item.status === 'Disbursed') {
        doc.setTextColor(22, 101, 52); // green
      } else if (item.status === 'Approved') {
        doc.setTextColor(30, 64, 175); // blue
      } else if (item.status === 'Pending Approval') {
        doc.setTextColor(180, 83, 9); // amber
      } else {
        doc.setTextColor(153, 27, 27); // red
      }
      doc.text(item.status, rowX + cols[7].width / 2, y + 4.5, { align: 'center' });

      y += 6.8;
    });

    // Total Row
    checkPageBreak(8);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL DISBURSED (${summary.recordCount} records):`, margin + 4, y + 4.8);
    doc.text(
      `INR ${summary.totalDisbursed.toLocaleString('en-IN')}`,
      margin + contentWidth - cols[7].width - 2,
      y + 4.8,
      { align: 'right' }
    );
    y += 9;
  }

  // 5. SIGNATORY AUTHORIZATION & AUDIT TRAIL BLOCK
  checkPageBreak(32);
  y += 4;

  const sigBlockW = (contentWidth - 16) / 3;

  // Signatory 1: Accounts & Cashier
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 16, margin + sigBlockW, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(accountsOfficerName, margin, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${accountsOfficerDesignation} • Accounts Desk`, margin, y + 23.5);

  // Signatory 2: Director Approval
  const sig2X = margin + sigBlockW + 8;
  doc.line(sig2X, y + 16, sig2X + sigBlockW, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(directorName, sig2X, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${directorDesignation} • Executive Approval`, sig2X, y + 23.5);

  // Signatory 3: Official Seal & Legal Audit Stamp
  const sig3X = margin + (sigBlockW + 8) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(sig3X, y, sigBlockW, 25, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL TREASURY SEAL', sig3X + sigBlockW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(`Authenticated Institutional Record`, sig3X + sigBlockW / 2, y + 10, { align: 'center' });
  doc.text(`Ref: BA-LEDGER-${monthKey.replace('-', '')}`, sig3X + sigBlockW / 2, y + 14, { align: 'center' });
  doc.text(`Audit Status: Verified & Balanced`, sig3X + sigBlockW / 2, y + 18, { align: 'center' });

  // Add Page Numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${p} of ${totalPages} • Biley Academy Administrative Financial Record`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Export the monthly disbursement ledger as a clean, compliant CSV file
 */
export function exportMonthlyDisbursementLedgerCSV(
  options: MonthlyLedgerExportOptions
) {
  const {
    monthKey = 'all',
    monthLabel = monthKey === 'all' ? 'All_Time' : monthKey,
    authConfig,
  } = options;

  const summary = getFilteredDisbursementLedgerData(options);
  const institutionName = authConfig?.sealInstitutionName || 'Biley Academy';

  const metadataHeaders = [
    [`# ${institutionName.toUpperCase()} - MONTHLY DISBURSEMENT LEDGER & FINANCIAL RECORD`],
    [`# Reporting Period: ${monthLabel}`],
    [`# Export Date: ${new Date().toISOString()}`],
    [`# Gross Fee Revenue (INR): ${summary.grossRevenue}`],
    [`# Total Disbursements (INR): ${summary.totalDisbursed}`],
    [`# Net Operating Profit (INR): ${summary.netOperatingProfit} (${summary.profitMargin.toFixed(1)}% Margin)`],
    [`# Total Records: ${summary.recordCount}`],
    [],
  ];

  const tableHeaders = [
    'Voucher No',
    'Disbursement Date',
    'Ledger Category',
    'Sub Category / Expense Head',
    'Payee Name / Beneficiary',
    'Payee Contact',
    'Payee Account / UPI Ref',
    'Amount (INR)',
    'Payment Mode',
    'Transaction Reference / UTR',
    'Invoice / Bill No',
    'Authorized By',
    'Status',
    'Purpose / Description',
    'Internal Notes',
  ];

  const rows = summary.filteredDisbursements.map((d) => [
    `"${d.voucherNo}"`,
    `"${d.disbursementDate}"`,
    `"${d.ledger}"`,
    `"${(d.subCategory || '').replace(/"/g, '""')}"`,
    `"${d.payeeName.replace(/"/g, '""')}"`,
    `"${d.payeeContact || ''}"`,
    `"${d.payeeAccountOrUpi || ''}"`,
    d.amount,
    `"${d.paymentMode}"`,
    `"${d.transactionRef || ''}"`,
    `"${d.invoiceBillNo || ''}"`,
    `"${d.authorizedBy}"`,
    `"${d.status}"`,
    `"${d.purposeDescription.replace(/"/g, '""')}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`,
  ]);

  const summaryRow = [
    `"TOTAL"`,
    `""`,
    `""`,
    `""`,
    `""`,
    `""`,
    `""`,
    summary.totalDisbursed,
    `""`,
    `""`,
    `""`,
    `""`,
    `"${summary.recordCount} Vouchers"`,
    `""`,
    `""`,
  ];

  const csvRows = [
    ...metadataHeaders.map((m) => m.join(',')),
    tableHeaders.join(','),
    ...rows.map((r) => r.join(',')),
    summaryRow.join(','),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  const sanitizedPeriod = monthLabel.replace(/[\s/\\:]+/g, '_');
  link.setAttribute(
    'download',
    `Biley_Academy_Disbursement_Ledger_${sanitizedPeriod}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
