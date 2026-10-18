export interface Product {
  id: string;
  name: string;
  tagline: string;
  sku?: string;
  category?: string;
  price: number; // Current selling price (e.g. 299)
  originalPrice: number; // MRP / strikethrough price (e.g. 399)
  weight: string; // e.g. "250g"
  shortDescription: string;
  fullDescription?: string;
  image: string;
  imageUrl?: string; // Optional convenience alias
  images?: string[]; // Additional product photos gallery
  inStock: boolean;
  stockCount?: number;
  lowStockThreshold?: number;
  stockStatusText?: string;
  minQuantity?: number;
  maxQuantity?: number;
  badge?: string; // e.g. "Best Seller" or "Farm Fresh"
  isFeatured?: boolean;
  isBestseller?: boolean;
  highlights?: string[];
  deliveryCharge?: number; // -1 or undefined for default store delivery
  altText?: string;
  imageOrder?: string[];
  foodCompliance?: FoodComplianceSettings;
}

export interface Coupon {
  id: string;
  code: string; // e.g. "WELCOME10", "MAKNUTS50", "FREESHIP"
  discountType: 'percentage' | 'fixed' | 'free_delivery';
  discountValue: number; // percentage (e.g. 10) or fixed amount in ₹ (e.g. 50)
  minOrderValue?: number; // minimum cart value to apply coupon
  maxDiscount?: number; // maximum discount cap for percentage discounts
  startDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  usageLimit?: number; // total times coupon can be redeemed
  usedCount?: number; // times coupon was redeemed
  perCustomerLimit?: number; // max redemptions per customer phone
  applicableProductIds?: string[]; // specific products (empty for all)
  enabled: boolean;
  firstOrderOnly?: boolean;
  description?: string;
}

export interface NutritionFacts {
  servingSize?: string; // e.g. "100g"
  energy?: string; // e.g. "347 kcal"
  protein?: string; // e.g. "9.7 g"
  carbohydrates?: string; // e.g. "76.9 g"
  sugar?: string; // e.g. "0.0 g"
  addedSugar?: string; // e.g. "0.0 g"
  fat?: string; // e.g. "0.1 g"
  saturatedFat?: string; // e.g. "0.0 g"
  transFat?: string; // e.g. "0.0 g"
  sodium?: string; // e.g. "2.0 mg"
  cholesterol?: string; // e.g. "0.0 mg"
  dietaryFiber?: string; // e.g. "14.5 g"
  calcium?: string; // e.g. "60.0 mg"
  iron?: string; // e.g. "1.4 mg"
}

export interface ProductClaims {
  highProtein?: boolean;
  glutenFree?: boolean;
  noPreservatives?: boolean;
  zeroTransFat?: boolean;
  noAddedSugar?: boolean;
  natural100?: boolean;
  customClaims?: string[];
}

export interface FoodComplianceSettings {
  enabled?: boolean;
  fssaiNumber?: string; // FSSAI 14-digit licence number
  ingredients?: string;
  allergens?: string;
  isVeg?: boolean;
  isVegetarian?: boolean;
  netQuantity?: string;
  shelfLife?: string;
  storageInstructions?: string;
  servingInstructions?: string;
  countryOfOrigin?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  packerName?: string;
  packerAddress?: string;
  marketerName?: string;
  marketerAddress?: string;
  customerCarePhone?: string;
  customerCareEmail?: string;
  customerCareAddress?: string;
  batchLotFormat?: string;
  otherLegalDetails?: string;
  nutrition?: NutritionFacts;
  claims?: ProductClaims;
}

export interface SectionVisibility {
  announcementBar?: boolean;
  headerNavigation?: boolean;
  heroBanner?: boolean;
  promoBanner?: boolean;
  productShowcase?: boolean;
  benefitsSection?: boolean;
  foodCompliance?: boolean;
  gallerySection?: boolean;
  reviewsSection?: boolean;
  faqSection?: boolean;
  aboutSection?: boolean;
  contactSection?: boolean;
  floatingWhatsApp?: boolean;
  footer?: boolean;
}

export interface HeroSectionSettings {
  badge?: string;
  heading?: string;
  subheading?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  bannerImage?: string;
  trustChips?: string[];
  showCtaButtons?: boolean;
  enablePrimaryCta?: boolean;
  enableSecondaryCta?: boolean;
}

export interface PromoBannerSettings {
  enabled?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  couponCodeBadge?: string;
  bgColor?: 'emerald' | 'amber' | 'stone';
  ctaText?: string;
  ctaLink?: string;
  bgGradient?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  visible?: boolean;
}

export interface SocialLinksSettings {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface SeoSettings {
  pageTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  productSeoTitle?: string;
  productDescription?: string;
  imageAltText?: string;
}

export interface OrderDisplaySettings {
  // WhatsApp Order Message Display Toggles
  useStructuredFormat?: boolean; // Default true: produces the clean, structured receipt
  showOrderHeader?: boolean;
  showOrderId?: boolean;
  showOrderDate?: boolean;
  showCustomerDetails?: boolean;
  showCustomerName?: boolean;
  showCustomerPhone?: boolean;
  showCustomerAddress?: boolean;
  showCustomerPincode?: boolean;
  
  showOrderDetails?: boolean;
  showProductName?: boolean;
  showUnitPrice?: boolean;
  showQuantity?: boolean;
  showBaseAmount?: boolean;
  showDiscount?: boolean;
  showCouponDiscount?: boolean;
  showSubtotal?: boolean;
  showDeliveryCharge?: boolean;
  showFinalPayableAmount?: boolean;

  showPaymentMethod?: boolean;
  showUpiTransactionId?: boolean;
  showPaymentVerificationNote?: boolean;
  showCodNotice?: boolean;
  showCustomerNote?: boolean;
  showClosingText?: boolean;
  closingText?: string;

  // Checkout Ordering Controls (During order submission by customer)
  checkoutShowProductCard?: boolean;
  checkoutShowQuantityStepper?: boolean;
  checkoutShowCustomerName?: boolean;
  checkoutShowPhone?: boolean;
  checkoutShowAddress?: boolean;
  checkoutRequireAddress?: boolean;
  checkoutShowPincode?: boolean;
  checkoutRequirePincode?: boolean;
  checkoutShowLandmark?: boolean;
  checkoutShowAlternatePhone?: boolean;
  checkoutShowCustomerNote?: boolean;
  checkoutAllowUpi?: boolean;
  checkoutAllowCod?: boolean;
  checkoutShowUpiQr?: boolean;
  checkoutShowUpiVerificationNote?: boolean;
  checkoutShowEstimatedDelivery?: boolean;
  checkoutEstimatedDeliveryText?: string;
  checkoutShowCouponInput?: boolean;
  checkoutShowPriceBreakdown?: boolean;
  checkoutShowBaseAmount?: boolean;
  checkoutShowStoreDiscount?: boolean;
  checkoutShowCouponDiscount?: boolean;
  checkoutShowSubtotal?: boolean;
  checkoutShowDeliveryCharge?: boolean;
  checkoutShowDeliveryIncentive?: boolean;
  checkoutShowTotalSavings?: boolean;
  checkoutSubmitButtonText?: string;
}

export interface WhatsAppSettings {
  businessNumber?: string;
  supportNumber?: string;
  orderTemplate?: string;
  paymentTemplate?: string;
  supportTemplate?: string;
  supportMessageTemplate?: string;
  floatingButtonText?: string;
  enabled?: boolean;
  enableFloatingButton?: boolean;
  phoneNumber?: string; // backwards compatibility alias
  orderDisplaySettings?: OrderDisplaySettings;
}

export interface FlashOfferSettings {
  enabled: boolean;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  badgeText: string;
}

export interface MediaItem {
  id: string;
  url: string;
  label: string;
  tag: 'logo' | 'hero' | 'product' | 'promo' | 'gallery';
  createdAt?: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  desc: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  location?: string;
  rating: number; // 1 to 5
  comment: string;
  originalComment?: string; // Original text preserved if edited by admin
  adminEditedAt?: string; // Timestamp when admin edited customer text
  orderId?: string; // Optional order ID
  phone?: string; // Optional customer mobile (never exposed publicly)
  email?: string;
  photo?: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected'; // All new reviews default to 'pending'
  verifiedBuyer?: boolean; // Set only when exact Order ID + mobile matches Delivered order
  verifiedOrderNumber?: string; // Reference to verified order number
  storeReply?: string; // Optional public store response
  storeReplyAt?: string; // Timestamp of store reply
  createdAt: string;
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
  rights?: string;
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
  logoUrl?: string;
  brandBadge: string;
  bannerText: string;
  bannerVisible: boolean;
  
  // Pricing, Discount & Order Controls
  deliveryCharge: number;
  freeDeliveryThreshold: number; // 0 for disabled
  freeDeliveryAllOrders?: boolean;
  discountEnabled: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  orderIdPrefix: string; // default "MK"

  upiId: string;
  upiPayeeName: string;
  enableUpi: boolean;
  enableCod: boolean;
  whatsappNumber: string; // "+91 78010 51792" or "917801051792"
  supportPhone: string;
  supportEmail: string;
  address: string;
  supportHours?: string;
  trustBadges: string[];
  buttons: {
    buyNow: string;
    whatsappOrder: string;
    copyUpi: string;
    chatWhatsApp: string;
    trackOrder: string;
    trackBanner: string;
    floatingWhatsApp?: string;
    enableBuyNow?: boolean;
    enableWhatsAppOrder?: boolean;
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
    cancellation?: string;
  };

  // Top-to-Bottom Storefront Control
  sectionVisibility?: SectionVisibility;
  sectionOrder?: string[];
  productSectionTitle?: string;
  productSectionSubtitle?: string;
  foodComplianceSectionTitle?: string;
  foodComplianceSectionSubtitle?: string;
  faqSectionTitle?: string;
  faqSectionSubtitle?: string;
  faqShowContactCallout?: boolean;
  faqContactCalloutText?: string;
  faqContactButtonText?: string;
  contactSectionTitle?: string;
  contactSectionSubtitle?: string;
  heroSection?: HeroSectionSettings;
  promoBanner?: PromoBannerSettings;
  foodCompliance?: FoodComplianceSettings;
  coupons?: Coupon[];
  flashOffer?: FlashOfferSettings;
  faqs?: FaqItem[];
  seo?: SeoSettings;
  whatsAppSettings?: WhatsAppSettings;
  orderDisplaySettings?: OrderDisplaySettings;
  socialLinks?: SocialLinksSettings;
  mediaLibrary?: MediaItem[];
}

export type PaymentStatus = 
  | 'Pending'
  | 'Verification Required'
  | 'Paid / Verified'
  | 'Failed'
  | 'Refunded'
  | 'COD Pending'
  | 'COD Collected';

export interface OrderPricingSnapshot {
  productId: string;
  productName: string;
  unitPrice: number; // Selling price at purchase time
  originalPrice: number; // MRP at purchase time
  quantity: number;
  baseAmount: number; // unitPrice * quantity
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountAmount: number;
  couponCode?: string;
  couponType?: 'percentage' | 'fixed' | 'free_delivery';
  couponDiscount?: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
}

export interface OrderAuditEntry {
  changedAt: string; // ISO date string
  changedBy: string; // Admin identity / identifier
  field: string;
  oldValue: string | number;
  newValue: string | number;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "MK-261008-A7F3"
  customerName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode: string;
  productId: string;
  productName: string;
  productWeight: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number; // MRP at purchase time
  baseAmount?: number; // unitPrice * quantity
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  discountAmount?: number;
  couponCode?: string;
  couponType?: 'percentage' | 'fixed' | 'free_delivery';
  couponDiscount?: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  pricingSnapshot?: OrderPricingSnapshot; // Immutable snapshot at purchase time
  auditHistory?: OrderAuditEntry[]; // Audit trail for financial / critical adjustments
  paymentMethod: 'upi' | 'cod';
  paymentStatus: PaymentStatus;
  upiRefNumber?: string;
  paymentScreenshot?: string; // base64 (maintained for backward compatibility with old orders only)
  note?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  courierName?: string;
  trackingNumber?: string;
  courierTrackingNumber?: string;
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
  category?: string;
  message: string;
  photo?: string;
  createdAt: string;
}

/**
 * Sanitized customer-facing order tracking information.
 * Does NOT contain sensitive personal data (no full address, no raw payment credentials).
 * Requires exact Order ID + exact 10-digit mobile number to access.
 */
export interface OrderTrackingInfo {
  id: string; // e.g. "mk10001_9876543210"
  orderNumber: string; // e.g. "MK10001"
  phoneLast4?: string; // e.g. "3210"
  createdAt: string; // ISO date string
  productId: string;
  productName: string;
  productWeight: string;
  quantity: number;
  unitPrice?: number;
  baseAmount?: number;
  discountAmount?: number;
  subtotal?: number;
  deliveryCharge?: number;
  totalAmount: number;
  paymentMethod: 'upi' | 'cod';
  paymentStatus?: PaymentStatus;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  statusNotes?: string;
}

/**
 * Generates the unique deterministic tracking document key from Order Number and registered Phone.
 * Requires both exact Order ID and 10-digit mobile number.
 */
export function getOrderTrackingKey(orderNumber: string, phone: string): string {
  const cleanOrderNum = (orderNumber || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  return `${cleanOrderNum}_${cleanPhone}`;
}

