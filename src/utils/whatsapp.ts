import { Order, OrderDisplaySettings } from '../types';
import { DEFAULT_ORDER_DISPLAY_SETTINGS } from '../constants';

export function formatWhatsAppNumber(phone: string): string {
  // Strip all non-digits
  const cleaned = (phone || '').replace(/\D/g, '');
  // If 10 digits without 91, add 91
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

export function formatOrderDate(dateString?: string): string {
  try {
    const d = dateString ? new Date(dateString) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB');
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day} ${month} ${year}, ${time}`;
  } catch (e) {
    return new Date().toLocaleDateString('en-GB');
  }
}

export interface WhatsAppTemplateData {
  orderId?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  mobile?: string;
  address?: string;
  deliveryAddress?: string;
  shippingAddress?: string;
  pincode?: string;
  pin?: string;
  productName?: string;
  productWeight?: string;
  quantity?: number | string;
  total?: number | string;
  amount?: number | string;
  subtotal?: number | string;
  deliveryCharge?: number | string;
  paymentMethod?: string;
  utr?: string;
  note?: string;
  trackingUrl?: string;
  supportPhone?: string;
}

/**
 * Authoritative template renderer supporting placeholders:
 * {{orderId}}, {{customerName}}, {{phone}}, {{address}}, {{pincode}}, {{amount}}, {{paymentMethod}}, {{trackingUrl}}, {{supportPhone}}
 * as well as {{productName}}, {{quantity}}, {{total}}, {{utr}}, {{note}}
 */
export function renderWhatsAppTemplate(template: string, data: WhatsAppTemplateData): string {
  if (!template || !template.trim()) return '';

  const amt = data.amount !== undefined ? String(data.amount) : String(data.total || 0);
  const phone = data.phone || data.customerPhone || data.mobile || '';
  const address = data.address || data.deliveryAddress || data.shippingAddress || '';
  const pincode = data.pincode || data.pin || '';

  let message = template;
  message = message.replace(/\{\{orderId\}\}/gi, data.orderId || '');
  message = message.replace(/\{\{customerName\}\}/gi, data.customerName || 'Valued Customer');
  message = message.replace(/\{\{phone\}\}/gi, phone);
  message = message.replace(/\{\{customerPhone\}\}/gi, phone);
  message = message.replace(/\{\{mobile\}\}/gi, phone);
  message = message.replace(/\{\{address\}\}/gi, address);
  message = message.replace(/\{\{deliveryAddress\}\}/gi, pincode ? `${address}, PIN: ${pincode}` : address);
  message = message.replace(/\{\{shippingAddress\}\}/gi, pincode ? `${address}, PIN: ${pincode}` : address);
  message = message.replace(/\{\{pincode\}\}/gi, pincode);
  message = message.replace(/\{\{pin\}\}/gi, pincode);
  message = message.replace(/\{\{amount\}\}/gi, amt);
  message = message.replace(/\{\{paymentMethod\}\}/gi, data.paymentMethod || 'UPI');
  message = message.replace(/\{\{trackingUrl\}\}/gi, data.trackingUrl || 'https://maknuts.com/track');
  message = message.replace(/\{\{supportPhone\}\}/gi, data.supportPhone || '+91 78010 51792');
  message = message.replace(/\{\{productName\}\}/gi, data.productName || 'Maknuts Makhana');
  message = message.replace(/\{\{productWeight\}\}/gi, data.productWeight || '');
  message = message.replace(/\{\{quantity\}\}/gi, String(data.quantity || 1));
  message = message.replace(/\{\{total\}\}/gi, amt);
  message = message.replace(/\{\{utr\}\}/gi, data.utr ? `📝 *UTR:* ${data.utr}` : '');
  message = message.replace(/\{\{note\}\}/gi, data.note ? `💬 *Note:* ${data.note}` : '');

  // Backwards compatibility for single-brace templates
  message = message.replace(/\{orderId\}/gi, data.orderId || '');
  message = message.replace(/\{orderNumber\}/gi, data.orderId || '');
  message = message.replace(/\{order_id\}/gi, data.orderId || '');
  message = message.replace(/\{customerName\}/gi, data.customerName || 'Valued Customer');
  message = message.replace(/\{customer_name\}/gi, data.customerName || 'Valued Customer');
  message = message.replace(/\{phone\}/gi, phone);
  message = message.replace(/\{customerPhone\}/gi, phone);
  message = message.replace(/\{mobile\}/gi, phone);
  message = message.replace(/\{address\}/gi, address);
  message = message.replace(/\{deliveryAddress\}/gi, pincode ? `${address}, PIN: ${pincode}` : address);
  message = message.replace(/\{shippingAddress\}/gi, pincode ? `${address}, PIN: ${pincode}` : address);
  message = message.replace(/\{pincode\}/gi, pincode);
  message = message.replace(/\{pin\}/gi, pincode);
  message = message.replace(/\{productName\}/gi, data.productName || 'Maknuts Makhana');
  message = message.replace(/\{product_name\}/gi, data.productName || 'Maknuts Makhana');
  message = message.replace(/\{quantity\}/gi, String(data.quantity || 1));
  message = message.replace(/\{total\}/gi, amt);
  message = message.replace(/\{amount\}/gi, amt);
  message = message.replace(/\{paymentMethod\}/gi, data.paymentMethod || 'UPI');
  message = message.replace(/\{trackingUrl\}/gi, data.trackingUrl || 'https://maknuts.com/track');
  message = message.replace(/\{supportPhone\}/gi, data.supportPhone || '+91 78010 51792');
  message = message.replace(/\{items\}/gi, `${data.quantity || 1}x ${data.productName || 'Maknuts Makhana'}`);

  return message.trim();
}

/**
 * Generates the authoritative WhatsApp Order Sharing Message.
 * Formatted exactly like the reference template:
 * 🌿 NEW ORDER – MAKNUTS MAKHANA 🌿
 * 
 * 📦 Order ID: MK-261010-8743
 * 📅 Date: 10 Oct 2026, 1:44 pm
 * 
 * 👤 CUSTOMER DETAILS:
 * • Name: ...
 * • Mobile: ...
 * • Address: ...
 * • PIN Code: ...
 * 
 * 🛒 ORDER DETAILS:
 * • Product: ...
 * • Unit Price: ...
 * • Quantity: ...
 * • Base Amount: ...
 * • Subtotal: ...
 * • Delivery Charge: ...
 * 💰 FINAL PAYABLE AMOUNT: ...
 * 
 * 💳 PAYMENT METHOD: ...
 * 📝 UPI Transaction ID / UTR: ...
 * 📸 Payment Verification: ...
 * 
 * _Please confirm my order and send dispatch details. Thank you!_
 * 
 * All fields are controllable via OrderDisplaySettings configured from the Admin Portal.
 */
export function generateOrderWhatsAppMessage(
  order: Order, 
  shopName: string = 'Maknuts Makhana', 
  customTemplate?: string,
  displaySettings?: OrderDisplaySettings
): string {
  const ds: OrderDisplaySettings = {
    ...DEFAULT_ORDER_DISPLAY_SETTINGS,
    ...(displaySettings || {})
  };

  // If merchant explicitly configured custom template AND toggled structured receipt off
  const useStructuredReceipt = ds.useStructuredFormat !== false;

  const isDefaultTemplate = 
    !customTemplate || 
    !customTemplate.trim() || 
    customTemplate.includes('NEW ORDER - MAKNUTS') ||
    customTemplate.includes('NEW ORDER – MAKNUTS') ||
    customTemplate.includes('Hello {{customerName}}');

  if (!useStructuredReceipt && customTemplate && customTemplate.trim() && !isDefaultTemplate) {
    let templateToUse = customTemplate.trim();

    // Critical: If the custom template does not contain the customer's phone or delivery address,
    // dynamically inject them so the merchant and courier ALWAYS receive delivery details.
    const hasAddressField = 
      templateToUse.includes('{{address}}') || 
      templateToUse.includes('{address}') ||
      templateToUse.includes('{{deliveryAddress}}');

    const hasPhoneField = 
      templateToUse.includes('{{phone}}') || 
      templateToUse.includes('{phone}') ||
      templateToUse.includes('{{mobile}}') ||
      templateToUse.includes('{mobile}');

    if (!hasAddressField || !hasPhoneField) {
      let customerDetailsBlock = '';
      if (!hasPhoneField && order.phone) {
        customerDetailsBlock += `\n📱 *Mobile:* {{phone}}`;
      }
      if (!hasAddressField && order.address) {
        customerDetailsBlock += `\n📍 *Delivery Address:* {{address}}${order.pincode ? `, PIN: {{pincode}}` : ''}`;
      }

      if (customerDetailsBlock) {
        if (templateToUse.includes('{{customerName}}')) {
          templateToUse = templateToUse.replace('{{customerName}}', `{{customerName}}${customerDetailsBlock}`);
        } else if (templateToUse.includes('{customerName}')) {
          templateToUse = templateToUse.replace('{customerName}', `{customerName}${customerDetailsBlock}`);
        } else {
          templateToUse = `${templateToUse}\n${customerDetailsBlock.trim()}`;
        }
      }
    }

    const rendered = renderWhatsAppTemplate(templateToUse, {
      orderId: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      customerPhone: order.phone,
      mobile: order.phone,
      address: order.address,
      deliveryAddress: order.address,
      pincode: order.pincode,
      pin: order.pincode,
      productName: order.productName,
      productWeight: order.productWeight,
      quantity: order.quantity,
      total: order.totalAmount,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery',
      utr: order.upiRefNumber,
      note: order.note,
    });
    if (rendered) return rendered;
  }

  // Structured Order WhatsApp Message (Matches exact user screenshot)
  const isUpi = order.paymentMethod === 'upi';
  const cleanShopName = (shopName || 'Maknuts Makhana').toUpperCase();
  const lines: string[] = [];

  // 1. Header
  if (ds.showOrderHeader !== false) {
    lines.push(`🌿 *NEW ORDER – ${cleanShopName}* 🌿`);
    lines.push(``);
  }

  // 2. Order ID
  if (ds.showOrderId !== false) {
    lines.push(`📦 *Order ID:* ${order.orderNumber}`);
  }

  // 3. Date
  if (ds.showOrderDate !== false) {
    lines.push(`📅 *Date:* ${formatOrderDate(order.createdAt)}`);
  }

  // 4. CUSTOMER DETAILS (Guaranteed to show Name, Mobile, Address, PIN Code)
  if (ds.showCustomerDetails !== false) {
    const customerLines: string[] = [];
    if (ds.showCustomerName !== false && order.customerName) {
      customerLines.push(`• *Name:* ${order.customerName}`);
    }
    if (ds.showCustomerPhone !== false && order.phone) {
      customerLines.push(`• *Mobile:* ${order.phone}`);
    }
    if ((order as any).alternatePhone) {
      customerLines.push(`• *Alt Mobile:* ${(order as any).alternatePhone}`);
    }
    if (ds.showCustomerAddress !== false && order.address) {
      const landmarkText = (order as any).landmark ? ` (Landmark: ${(order as any).landmark})` : '';
      customerLines.push(`• *Address:* ${order.address}${landmarkText}`);
    }
    if (ds.showCustomerPincode !== false && order.pincode) {
      customerLines.push(`• *PIN Code:* ${order.pincode}`);
    }

    if (customerLines.length > 0) {
      lines.push(``);
      lines.push(`👤 *CUSTOMER DETAILS:*`);
      lines.push(...customerLines);
    }
  }

  // 5. ORDER DETAILS
  if (ds.showOrderDetails !== false) {
    const orderLines: string[] = [];
    if (ds.showProductName !== false) {
      const weightStr = order.productWeight ? ` (${order.productWeight})` : '';
      orderLines.push(`• *Product:* ${order.productName}${weightStr}`);
    }
    if (ds.showUnitPrice !== false) {
      orderLines.push(`• *Unit Price:* ₹${order.unitPrice}`);
    }
    if (ds.showQuantity !== false) {
      orderLines.push(`• *Quantity:* ${order.quantity}`);
    }
    if (ds.showBaseAmount !== false) {
      const baseAmt = order.baseAmount ?? (order.unitPrice * order.quantity);
      orderLines.push(`• *Base Amount:* ₹${baseAmt}`);
    }
    if (ds.showDiscount !== false && order.discountAmount && order.discountAmount > 0) {
      const discNote = order.discountType === 'percentage' && order.discountValue ? ` (${order.discountValue}% OFF)` : '';
      orderLines.push(`• *Discount:* -₹${order.discountAmount}${discNote}`);
    }
    if (ds.showCouponDiscount !== false && order.couponDiscount && order.couponDiscount > 0) {
      orderLines.push(`• *Coupon (${order.couponCode || 'PROMO'}):* -₹${order.couponDiscount}`);
    }
    if (ds.showSubtotal !== false) {
      orderLines.push(`• *Subtotal:* ₹${order.subtotal}`);
    }
    if (ds.showDeliveryCharge !== false) {
      const delStr = order.deliveryCharge === 0 ? 'FREE (₹0)' : `₹${order.deliveryCharge}`;
      orderLines.push(`• *Delivery Charge:* ${delStr}`);
    }

    if (orderLines.length > 0) {
      lines.push(``);
      lines.push(`🛒 *ORDER DETAILS:*`);
      lines.push(...orderLines);
    }

    if (ds.showFinalPayableAmount !== false) {
      lines.push(`💰 *FINAL PAYABLE AMOUNT:* ₹${order.totalAmount}`);
    }
  }

  // 6. PAYMENT METHOD
  if (ds.showPaymentMethod !== false) {
    lines.push(``);
    lines.push(`💳 *PAYMENT METHOD:* ${isUpi ? 'UPI' : 'Cash on Delivery'}`);

    if (isUpi) {
      if (ds.showUpiTransactionId !== false && order.upiRefNumber && order.upiRefNumber.trim()) {
        lines.push(`📝 *UPI Transaction ID / UTR:* ${order.upiRefNumber.trim()}`);
      }
      if (ds.showPaymentVerificationNote !== false) {
        lines.push(``);
        lines.push(`📸 *Payment Verification:* Please verify my payment. I will send my payment screenshot here in this chat for verification.`);
      }
    } else {
      if (ds.showCodNotice !== false) {
        lines.push(``);
        lines.push(`💵 *Payment on Delivery:* Please collect ₹${order.totalAmount} in cash when order is delivered.`);
      }
    }
  }

  // 7. CUSTOMER NOTE
  if (ds.showCustomerNote !== false && order.note && order.note.trim()) {
    lines.push(``);
    lines.push(`💬 *Customer Note:* ${order.note.trim()}`);
  }

  // 8. CLOSING TEXT
  if (ds.showClosingText !== false) {
    lines.push(``);
    const closing = ds.closingText || 'Please confirm my order and send dispatch details. Thank you!';
    lines.push(`_${closing}_`);
  }

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
