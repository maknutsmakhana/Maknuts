export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number; // Current selling price (e.g. 299)
  originalPrice: number; // MRP / strikethrough price (e.g. 399)
  weight: string; // e.g. "250g"
  shortDescription: string;
  fullDescription?: string;
  image: string;
  inStock: boolean;
  stockStatusText?: string;
  badge?: string; // e.g. "Best Seller" or "Farm Fresh"
  highlights?: string[];
}

export interface StoreSettings {
  shopName: string;
  tagline: string;
  logoText: string;
  bannerText: string;
  bannerVisible: boolean;
  deliveryCharge: number;
  freeDeliveryThreshold: number; // 0 for disabled
  upiId: string;
  upiPayeeName: string;
  enableUpi: boolean;
  enableCod: boolean;
  whatsappNumber: string; // "+91 78010 51792" or "917801051792"
  supportPhone: string;
  supportEmail: string;
  address: string;
  adminPassword: string;
  buttons: {
    buyNow: string;
    whatsappOrder: string;
    copyUpi: string;
    chatWhatsApp: string;
  };
  policies: {
    terms: string;
    privacy: string;
    returns: string;
    shipping: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "MK10001"
  customerName: string;
  phone: string;
  address: string;
  pincode: string;
  productId: string;
  productName: string;
  productWeight: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: 'upi' | 'cod';
  upiRefNumber?: string;
  paymentScreenshot?: string; // base64
  note?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  statusNotes?: string;
}
