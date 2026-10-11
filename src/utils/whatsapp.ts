import { Order } from '../types';

export function formatWhatsAppNumber(phone: string): string {
  // Strip all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // If 10 digits without 91, add 91
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

export function generateOrderWhatsAppMessage(order: Order, shopName: string = 'Maknuts'): string {
  const isUpi = order.paymentMethod === 'upi';
  const lines = [
    `🌿 *NEW ORDER - ${shopName.toUpperCase()}* 🌿`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Order ID:* ${order.orderNumber}`,
    `📅 *Date:* ${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    ``,
    `👤 *CUSTOMER DETAILS:*`,
    `• *Name:* ${order.customerName}`,
    `• *Mobile:* ${order.phone}`,
    `• *Address:* ${order.address}`,
    `• *PIN Code:* ${order.pincode}`,
    ``,
    `🛒 *ORDER DETAILS:*`,
    `• *Product:* ${order.productName} (${order.productWeight})`,
    `• *Unit Price:* ₹${order.unitPrice}`,
    `• *Quantity:* ${order.quantity}`,
    `• *Base Amount:* ₹${order.baseAmount ?? (order.unitPrice * order.quantity)}`,
    ...(order.discountAmount && order.discountAmount > 0 
      ? [`• *Discount:* -₹${order.discountAmount}${order.discountType === 'percentage' && order.discountValue ? ` (${order.discountValue}% OFF)` : ''}`]
      : []),
    `• *Subtotal:* ₹${order.subtotal}`,
    `• *Delivery Charge:* ${order.deliveryCharge === 0 ? 'FREE (₹0)' : `₹${order.deliveryCharge}`}`,
    `💰 *FINAL PAYABLE AMOUNT:* ₹${order.totalAmount}`,
    ``,
    `💳 *PAYMENT METHOD:* ${isUpi ? 'UPI' : 'Cash on Delivery'}`,
  ];

  if (isUpi) {
    if (order.upiRefNumber && order.upiRefNumber.trim()) {
      lines.push(`📝 *UPI Transaction ID / UTR:* ${order.upiRefNumber.trim()}`);
    }
    lines.push(
      ``,
      `📸 *Payment Verification:* Please verify my payment. I will send my payment screenshot here in this chat for verification.`
    );
  } else {
    lines.push(
      ``,
      `💵 *Payment on Delivery:* Please collect ₹${order.totalAmount} in cash when order is delivered.`
    );
  }

  if (order.note && order.note.trim()) {
    lines.push(``, `💬 *Customer Note:* ${order.note.trim()}`);
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_Please confirm my order and send dispatch details. Thank you!_`
  );

  return lines.join('\n');
}

export function createWhatsAppUrl(phone: string, text: string): string {
  const formattedNumber = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);
  // Using api.whatsapp.com/send ensures universal opening across Android, iOS, and Web
  return `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedText}`;
}

export function openWhatsAppDirectly(phone: string, text: string): boolean {
  try {
    const url = createWhatsAppUrl(phone, text);
    // Create an invisible anchor tag and trigger click to bypass popup blockers
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('Failed to open WhatsApp via link click', e);
    return false;
  }
}

