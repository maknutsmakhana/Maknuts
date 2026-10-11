import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Product, StoreSettings, Coupon } from '../types';

/**
 * Format currency in Indian Rupees
 */
const fmt = (num: number) => `INR ${Number(num || 0).toLocaleString('en-IN')}`;

/**
 * Clean up text for standard PDF fonts (avoid UTF-8 rupee symbol issues)
 */
const cleanStr = (str?: string) => (str || '').replace(/[\u20B9]/g, 'Rs. ').trim();

/**
 * Download a beautifully formatted single Order Invoice / Customer Receipt PDF
 */
export const downloadOrderInvoicePdf = (order: Order, store: StoreSettings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Emerald Top Brand Banner
  doc.setFillColor(10, 47, 34); // #0a2f22
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // #d97706
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(store.shopName || 'MAKNUTS MAKHANA', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 240, 235);
  doc.text(store.tagline || '100% Premium Roasted Fox Nuts & Superfoods', 14, 18);
  doc.text(`FSSAI Lic. No: ${store.foodCompliance?.fssaiNumber || '10424000000000'} | Ph: ${store.whatsappNumber || store.supportPhone || '+91 78010 51792'}`, 14, 23);

  // Invoice Label on Right
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 230, 138); // amber-200
  doc.text('TAX INVOICE', pageWidth - 14, 13, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice No: ${order.orderNumber}`, pageWidth - 14, 19, { align: 'right' });
  doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`, pageWidth - 14, 24, { align: 'right' });

  // Order & Customer Details Section
  let y = 36;
  doc.setTextColor(30, 41, 59);

  // Two columns: Billed To / Shipping Details vs Order Summary
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, (pageWidth - 32) / 2, 38, 2, 2, 'F');
  doc.roundedRect(14 + (pageWidth - 32) / 2 + 4, y, (pageWidth - 32) / 2, 38, 2, 2, 'F');

  // Left Col: Customer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 47, 34);
  doc.text('BILLED & DELIVER TO:', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(cleanStr(order.customerName) || 'Customer', 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: +91 ${order.phone || 'N/A'}`, 18, y + 17);
  const addressLines = doc.splitTextToSize(`${order.address || ''}`, (pageWidth - 32) / 2 - 8);
  doc.text(addressLines.slice(0, 2), 18, y + 22);
  doc.text(`Pincode: ${order.pincode || 'N/A'}`, 18, y + 33);

  // Right Col: Order Meta
  const rightX = 14 + (pageWidth - 32) / 2 + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 47, 34);
  doc.text('ORDER & PAYMENT DETAILS:', rightX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Status:`, rightX, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.status || 'Pending', rightX + 28, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Mode:`, rightX, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Manual UPI Payment', rightX + 28, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Status:`, rightX, y + 22);
  doc.setFont('helvetica', 'bold');
  const payColor = order.paymentStatus === 'Paid / Verified' ? [16, 120, 60] : [180, 80, 10];
  doc.setTextColor(payColor[0], payColor[1], payColor[2]);
  doc.text(order.paymentStatus || 'Pending', rightX + 28, y + 22);

  if (order.upiRefNumber) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`UTR / Ref No:`, rightX, y + 27);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(order.upiRefNumber, rightX + 28, y + 27);
  }

  if (order.courierName || order.trackingNumber || order.courierTrackingNumber) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Courier / AWB:`, rightX, y + 32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${order.courierName || 'Courier'} - ${order.trackingNumber || order.courierTrackingNumber || 'Tracking Active'}`, rightX + 28, y + 32);
  }

  y += 44;

  // Items Table
  const tableRows = [
    [
      1,
      `${order.productName || 'Maknuts Roasted Makhana'} (${order.productWeight || '250g'})`,
      order.quantity || 1,
      fmt(order.unitPrice || order.totalAmount),
      fmt((order.unitPrice || order.totalAmount) * (order.quantity || 1)),
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [10, 47, 34],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable.finalY || y + 25;
  let summaryY = finalY + 6;

  // Totals Breakdown (Right-aligned Box)
  const summaryBoxWidth = 80;
  const summaryX = pageWidth - 14 - summaryBoxWidth;

  doc.setFillColor(250, 250, 250);
  doc.rect(summaryX, summaryY, summaryBoxWidth, 38, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(summaryX, summaryY, summaryBoxWidth, 38, 'S');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');

  // Subtotal
  doc.text('Subtotal:', summaryX + 4, summaryY + 7);
  doc.text(fmt(order.subtotal || order.totalAmount), summaryX + summaryBoxWidth - 4, summaryY + 7, { align: 'right' });

  // Coupon Discount
  const disc = order.discountAmount || order.couponDiscount || 0;
  if (order.couponCode || disc > 0) {
    doc.setTextColor(16, 120, 60);
    doc.text(`Discount (${order.couponCode || 'Promo'}):`, summaryX + 4, summaryY + 13);
    doc.text(`- ${fmt(disc)}`, summaryX + summaryBoxWidth - 4, summaryY + 13, { align: 'right' });
  } else {
    doc.text('Discount:', summaryX + 4, summaryY + 13);
    doc.text('Rs. 0', summaryX + summaryBoxWidth - 4, summaryY + 13, { align: 'right' });
  }

  // Delivery Fee
  doc.setTextColor(71, 85, 105);
  doc.text('Delivery Charges:', summaryX + 4, summaryY + 19);
  doc.text(order.deliveryCharge === 0 ? 'FREE' : fmt(order.deliveryCharge || 0), summaryX + summaryBoxWidth - 4, summaryY + 19, { align: 'right' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, summaryY + 23, summaryX + summaryBoxWidth - 4, summaryY + 23);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 47, 34);
  doc.text('Grand Total:', summaryX + 4, summaryY + 31);
  doc.text(fmt(order.totalAmount), summaryX + summaryBoxWidth - 4, summaryY + 31, { align: 'right' });

  // Left side notes / Food & FSSAI / Terms
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Statutory & Compliance Details:', 14, summaryY + 7);
  doc.text(`- FSSAI License: ${store.foodCompliance?.fssaiNumber || '10424000000000'}`, 14, summaryY + 12);
  doc.text(`- Origin: Bihar, India | Category: Roasted Fox Nuts (Makhana)`, 14, summaryY + 17);
  doc.text(`- Packed & Marketed By: ${store.foodCompliance?.marketerName || store.shopName}`, 14, summaryY + 22);
  doc.text(`- Customer Care: ${store.supportEmail || 'maknutsmakhana@gmail.com'} | WhatsApp: ${store.whatsappNumber || '+91 78010 51792'}`, 14, summaryY + 27);
  doc.text('Thank you for choosing farm-fresh pure Maknuts Makhana!', 14, summaryY + 33);

  // Bottom Footer Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Computer generated tax invoice. Authentic Maknuts Store Order #${order.orderNumber}. Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Save the PDF
  doc.save(`Maknuts-Invoice-${order.orderNumber || 'Order'}.pdf`);
};

/**
 * Download a beautiful detailed PDF report of multiple selected orders or all orders
 */
export const downloadOrdersReportPdf = (orders: Order[], store: StoreSettings, reportTitle: string = 'Maknuts Orders Detailed Report') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Emerald Top Header
  doc.setFillColor(10, 47, 34);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${store.shopName?.toUpperCase() || 'MAKNUTS'} - ${reportTitle.toUpperCase()}`, 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 240, 235);
  doc.text(`Total Orders: ${orders.length} | Generated On: ${new Date().toLocaleString('en-IN')} | Store WhatsApp: ${store.whatsappNumber}`, 14, 17);

  // Key summary stats
  const totalRev = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid / Verified' || o.paymentStatus === 'COD Collected');
  const paidRev = paidOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const codCount = orders.filter(o => o.paymentMethod === 'cod').length;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 230, 138);
  doc.text(`Total Value: ${fmt(totalRev)} | Verified Paid: ${fmt(paidRev)} | COD Orders: ${codCount}`, pageWidth - 14, 14, { align: 'right' });

  // Table Data
  const rows = orders.map((o, idx) => [
    idx + 1,
    o.orderNumber,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A',
    o.customerName || 'N/A',
    o.phone || 'N/A',
    `${o.productName || 'Makhana'} (x${o.quantity || 1})`,
    fmt(o.totalAmount),
    o.paymentMethod.toUpperCase(),
    o.paymentStatus || 'Pending',
    o.status || 'Pending',
    o.pincode || 'N/A',
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Order No', 'Date', 'Customer', 'Mobile', 'Item Details', 'Total', 'Payment', 'Pay Status', 'Order Status', 'Pincode']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [10, 47, 34],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 16 },
      3: { cellWidth: 32 },
      4: { cellWidth: 24 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 24, halign: 'center' },
      9: { cellWidth: 22, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' },
    },
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Maknuts Store Operations Management System | Confidential Store Records`, pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`Maknuts-Orders-Detailed-Report-${Date.now()}.pdf`);
};

/**
 * Download Complete Store Executive Report PDF (Sales, Payments, Inventory, Coupons)
 */
export const downloadStoreExecutiveReportPdf = (
  orders: Order[],
  products: Product[],
  store: StoreSettings,
  coupons: Coupon[] = []
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top banner
  doc.setFillColor(10, 47, 34);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${store.shopName?.toUpperCase() || 'MAKNUTS'} - EXECUTIVE AUDIT REPORT`, 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 240, 235);
  doc.text(`Comprehensive Store Performance & Compliance Audit | Generated: ${new Date().toLocaleString('en-IN')}`, 14, 19);
  doc.text(`FSSAI Registration: ${store.foodCompliance?.fssaiNumber || '10424000000000'} | Store Admin Console`, 14, 24);

  let y = 36;

  // Key KPI Cards Grid
  const totalSales = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const paidSales = orders.filter(o => o.paymentStatus === 'Paid / Verified' || o.paymentStatus === 'COD Collected').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const aov = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;
  const uniquePhones = new Set(orders.map(o => o.phone).filter(Boolean)).size;

  const cardW = (pageWidth - 36) / 3;
  const cardH = 18;

  const kpis = [
    { title: 'Total Sales Revenue', val: fmt(totalSales), sub: `${orders.length} Total Orders` },
    { title: 'Verified Paid Revenue', val: fmt(paidSales), sub: 'Bank UTR & Verified COD' },
    { title: 'Average Order Value (AOV)', val: fmt(aov), sub: `${uniquePhones} Unique Customers` },
    { title: 'Pending Dispatch', val: `${pendingOrders} Orders`, sub: 'Requires Packing/AWB' },
    { title: 'Product Catalog Stock', val: `${products.length} SKUs`, sub: `${products.filter(p => p.inStock).length} In Stock Active` },
    { title: 'Active Coupons', val: `${coupons.filter(c => c.enabled).length} Vouchers`, sub: `${coupons.length} Total Configured` },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cx = 14 + col * (cardW + 4);
    const cy = y + row * (cardH + 4);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cx + 4, cy + 5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 47, 34);
    doc.text(kpi.val, cx + 4, cy + 11);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(kpi.sub, cx + 4, cy + 15);
  });

  y += cardH * 2 + 14;

  // Section 1: Product Inventory Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 47, 34);
  doc.text('1. Product Catalog & Inventory Status', 14, y);
  y += 4;

  const prodRows = products.map((p, idx) => [
    idx + 1,
    p.name,
    p.weight || '250g',
    fmt(p.originalPrice || p.price),
    fmt(p.price),
    p.inStock ? 'IN STOCK' : 'OUT OF STOCK',
    p.sku || `MK-SKU-${idx + 1}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product Name', 'Pack Size', 'MRP', 'Selling Price', 'Stock Status', 'SKU']],
    body: prodRows,
    theme: 'grid',
    headStyles: { fillColor: [10, 47, 34], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Active Coupons Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 47, 34);
  doc.text('2. Promo Coupons & Discount Rules', 14, y);
  y += 4;

  const couponRows = coupons.map((c, idx) => [
    idx + 1,
    c.code,
    c.discountType === 'percentage' ? `${c.discountValue}%` : c.discountType === 'fixed' ? fmt(c.discountValue) : 'Free Delivery',
    fmt(c.minOrderValue || 0),
    c.maxDiscount ? fmt(c.maxDiscount) : 'No Cap',
    c.enabled ? 'ACTIVE' : 'DISABLED',
    c.expiryDate || 'No Expiry',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Coupon Code', 'Discount', 'Min Order', 'Max Cap', 'Status', 'Expiry']],
    body: couponRows.length > 0 ? couponRows : [['-', 'None configured', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [10, 47, 34], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Maknuts Store Operations Management System | Confidential Executive Records`, pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`Maknuts-Store-Executive-Report-${Date.now()}.pdf`);
};

/**
 * Download Complete Food, FSSAI & Product Compliance Catalog PDF
 */
export const downloadFoodCompliancePdf = (store: StoreSettings, products: Product[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(10, 47, 34);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FOOD SAFETY & FSSAI COMPLIANCE DOSSIER', 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 240, 235);
  doc.text(`${store.shopName} | Statutory Label & Nutritional Facts Specification`, 14, 19);
  doc.text(`FSSAI License: ${store.foodCompliance?.fssaiNumber || '10424000000000'} | Category: Euryale Ferox (Fox Nuts)`, 14, 24);

  let y = 36;
  const fc = store.foodCompliance;

  // Legal Entities
  const entities = [
    ['FSSAI Central / State License No', fc?.fssaiNumber || '10424000000000'],
    ['Dietary Classification', fc?.isVegetarian ? '100% Vegetarian (Green Dot)' : 'Non-Vegetarian'],
    ['Manufacturer / Processor', `${fc?.manufacturerName || 'Maknuts Processing Unit'}, ${fc?.manufacturerAddress || 'Darbhanga, Bihar, India'}`],
    ['Packer / Packaging Facility', `${fc?.packerName || 'Maknuts Processing Unit'}, ${fc?.packerAddress || 'Darbhanga, Bihar, India'}`],
    ['Marketed By & Brand Owner', `${fc?.marketerName || 'Maknuts Agro Products'}, ${fc?.marketerAddress || 'India'}`],
    ['Customer Care Helpline', `${fc?.customerCareEmail || store.supportEmail} | Tel: ${fc?.customerCarePhone || store.whatsappNumber}`],
    ['Shelf Life & Best Before', `${fc?.shelfLife || '9 Months from packaging date'}`],
    ['Storage Instructions', `${fc?.storageInstructions || 'Store in a cool, dry place. Transfer to an airtight container after opening.'}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Statutory Compliance Parameter', 'Official Registered Detail']],
    body: entities,
    theme: 'grid',
    headStyles: { fillColor: [10, 47, 34], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Nutrition Facts
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 47, 34);
  doc.text('Lab Tested Nutritional Profile (Per 100g Serving)', 14, y);
  y += 4;

  const n = fc?.nutrition;
  const nutritionRows = [
    ['Energy / Calories', n?.energy || '347 kcal', 'High sustained energy without crash'],
    ['Protein', n?.protein || '9.7 g', 'Plant-based muscle building protein'],
    ['Carbohydrates', n?.carbohydrates || '76.9 g', 'Complex low-glycemic carbs'],
    ['Total Sugar (Naturally Occurring)', n?.sugar || '0.0 g', 'Zero added sugar'],
    ['Total Fat', n?.fat || '0.1 g', 'Naturally low in fat'],
    ['Saturated Fat', n?.saturatedFat || '0.0 g', 'Zero saturated fats'],
    ['Trans Fat', n?.transFat || '0.0 g', 'Zero trans fatty acids'],
    ['Cholesterol', n?.cholesterol || '0.0 mg', 'Heart-friendly food'],
    ['Dietary Fiber', n?.dietaryFiber || '14.5 g', 'Supports healthy digestion'],
    ['Calcium', n?.calcium || '60.0 mg', 'Bone and joint strength'],
    ['Iron', n?.iron || '1.4 mg', 'Hemoglobin support'],
    ['Sodium', n?.sodium || '2.0 mg', 'Low sodium — ideal for blood pressure'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nutrient Item', 'Amount per 100g', 'Nutritional Benefit']],
    body: nutritionRows,
    theme: 'grid',
    headStyles: { fillColor: [10, 47, 34], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  doc.save(`Maknuts-Food-FSSAI-Compliance-${Date.now()}.pdf`);
};
