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

export interface BenefitItem {
  id: string;
  title: string;
  desc: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  phone?: string;
  email?: string;
  photo?: string;
  category?: string;
  createdAt?: string;
  featured?: boolean;
}

export interface BenefitsSectionSettings {
  title: string;
  subtitle: string;
  items: BenefitItem[];
}

export interface ReviewsSectionSettings {
  title: string;
  subtitle: string;
  ratingText: string;
  guaranteeBadge: string;
  reviews: ReviewItem[];
}

export interface FooterSettings {
  about: string;
  qualityPromise: string;
  craftedBy: string;
  copyright: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  tag: string; // e.g. "Farm Harvest", "Customer Snap", "Batch Roasting", "Packaging"
  createdAt?: string;
}

export interface GallerySectionSettings {
  title: string;
  subtitle: string;
  buttonLabel: string;
  photos: GalleryPhoto[];
}

export interface StoreSettings {
  shopName: string;
  tagline: string;
  logoText: string;
  brandBadge: string;
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
  trustBadges: string[];
  buttons: {
    buyNow: string;
    whatsappOrder: string;
    copyUpi: string;
    chatWhatsApp: string;
    trackOrder: string;
    trackBanner: string;
  };
  benefitsSection: BenefitsSectionSettings;
  reviewsSection: ReviewsSectionSettings;
  gallerySection: GallerySectionSettings;
  footerText: FooterSettings;
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

export interface Feedback {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  rating: number; // 1 to 5
  category: string;
  message: string;
  photo?: string;
  createdAt: string;
}
