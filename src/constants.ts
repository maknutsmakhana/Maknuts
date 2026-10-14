import { Product, StoreSettings } from './types';
import defaultProductImage from './assets/images/maknuts_makhana_pouch_1791179105818.jpg';

export const DEFAULT_PRODUCT: Product = {
  id: 'maknuts-makhana-jumbo-250g',
  name: 'Maknuts Makhana',
  tagline: '100% Premium Bihar Fox Nuts · Handpicked Jumbo Grade',
  sku: 'MK-JUMBO-250',
  category: 'Raw Phool Makhana',
  price: 299,
  originalPrice: 399,
  weight: '250g Pouch',
  shortDescription: 'Naturally grown, sun-dried and gently roasted lotus seeds (Fox Nuts / Phool Makhana). Super crispy, zero trans fats, high protein, and packed with calcium and antioxidants. Sourced directly from Mithila, Bihar farms.',
  fullDescription: 'Maknuts Makhana brings you the purest, crunchiest, and largest grade fox nuts handpicked by artisan farmers. Naturally free from artificial flavors, coloring, and chemical preservatives. A guilt-free superfood snack ideal for tea time, fasting (vrat), gym diet, and daily wellness.',
  image: defaultProductImage,
  images: [
    defaultProductImage,
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  ],
  inStock: true,
  stockCount: 150,
  minQuantity: 1,
  maxQuantity: 20,
  stockStatusText: 'In Stock - Ready to Dispatch',
  badge: 'Premium Handpicked',
  isFeatured: true,
  isBestseller: true,
  highlights: [
    '100% Pure & Naturally Roasted',
    'Rich in Plant-Based Protein & Calcium',
    'Low Glycemic Index & Gluten-Free',
    'Zero Cholesterol & Low Sodium',
    'Farm Direct from Mithila, Bihar'
  ]
};

export const DEFAULT_SETTINGS: StoreSettings = {
  shopName: 'Maknuts',
  tagline: 'Pure & Crisp Healthy Makhana',
  logoText: 'MAKNUTS',
  brandBadge: 'Pure',
  bannerText: '🌱 100% Pure Makhana Direct from Bihar Farms · Flat ₹40 Delivery All India (Free on ₹600+)',
  bannerVisible: true,
  deliveryCharge: 40,
  freeDeliveryThreshold: 600,
  freeDeliveryAllOrders: false,
  discountEnabled: false,
  discountType: 'percentage',
  discountValue: 0,
  minOrderQuantity: 1,
  maxOrderQuantity: 20,
  orderIdPrefix: 'MK',
  upiId: '7504805846@ibl',
  upiPayeeName: 'Maknuts Makhana',
  enableUpi: true,
  enableCod: true,
  whatsappNumber: '+91 78010 51792',
  supportPhone: '+91 78010 51792',
  supportEmail: 'maknutsmakhana@gmail.com',
  address: 'Maknuts Agri Foods, Darbhanga, Bihar, India - 846004',
  supportHours: 'Mon - Sun: 9:00 AM - 9:00 PM',
  trustBadges: ['Jumbo Grade', 'Sun-Dried & Roasted', 'Zero Trans Fat'],
  buttons: {
    buyNow: 'Buy Now',
    whatsappOrder: 'PLACE ORDER ON WHATSAPP',
    copyUpi: 'Copy UPI ID',
    chatWhatsApp: 'Chat on WhatsApp',
    trackOrder: 'Track Order',
    trackBanner: 'Track Order Live',
  },
  benefitsSection: {
    title: 'Why Choose Maknuts Makhana?',
    subtitle: 'The ancient superfood from Bihar, prepared with pure traditional care.',
    items: [
      {
        id: 'b-1',
        title: '100% Farm Fresh',
        desc: 'Harvested directly from ponds in Mithila, Bihar without synthetic chemicals or bleaching.'
      },
      {
        id: 'b-2',
        title: 'Jumbo 6+ Sutta Grade',
        desc: 'Only the largest, fluffiest lotus seeds are handpicked for superior crunch and puffiness.'
      },
      {
        id: 'b-3',
        title: 'Slow Hand-Roasted',
        desc: 'Gently roasted in small batches to preserve natural crispiness and vital nutrients.'
      },
      {
        id: 'b-4',
        title: 'Heart & Diet Friendly',
        desc: 'Packed with plant protein, rich in calcium, zero trans fat, low sodium and gluten-free.'
      },
      {
        id: 'b-5',
        title: 'Hygienic Packaging',
        desc: 'Sealed in moisture-proof, food-grade zipper pouches to maintain peak crunchiness.'
      },
      {
        id: 'b-6',
        title: 'Prompt Delivery',
        desc: 'Dispatched directly to your doorstep across India with careful packaging.'
      }
    ]
  },
  reviewsSection: {
    title: 'Customer Reviews & Feedback',
    subtitle: 'Real reviews and feedback from happy customers across India who snack on Maknuts.',
    ratingText: '',
    guaranteeBadge: '100% Satisfaction or Easy Replacement',
    reviews: [
      {
        id: 'r-1',
        name: 'Priya Verma',
        location: 'Bangalore',
        rating: 5,
        category: 'Taste & Crunch Quality',
        comment: 'The size of the makhanas is truly jumbo! No burnt pieces, super crunchy, and lightly salted taste is pure perfection for my daily evening snack.',
        status: 'approved',
        verifiedBuyer: true,
        createdAt: '2026-09-15T10:00:00.000Z'
      },
      {
        id: 'r-2',
        name: 'Amit K.',
        location: 'New Delhi',
        rating: 5,
        category: 'Delivery & Shipping Speed',
        comment: 'Ordering on WhatsApp was surprisingly fast and effortless. Sent the message, paid via UPI, and got courier tracking the next day. Top quality.',
        status: 'approved',
        verifiedBuyer: true,
        createdAt: '2026-09-22T14:30:00.000Z'
      },
      {
        id: 'r-3',
        name: 'Sunita Mishra',
        location: 'Patna',
        rating: 5,
        category: 'Packaging & Seal',
        comment: "Best makhana I've tasted in months. You can feel the freshness right after opening the zipper seal. My parents love having it with their morning tea.",
        status: 'approved',
        verifiedBuyer: true,
        createdAt: '2026-10-01T09:15:00.000Z'
      }
    ]
  },
  gallerySection: {
    title: 'Our Purity in Pictures',
    subtitle: 'Direct from pristine wetlands of Mithila, Bihar to crispy, nutritious snack bowls.',
    buttonLabel: '📸 View Farm & Product Photos',
    photos: [
      {
        id: 'gp-1',
        url: defaultProductImage,
        caption: 'Maknuts Jumbo Grade Fox Nuts in sealed moisture-lock zipper pouch',
        tag: 'Packaging & Purity'
      },
      {
        id: 'gp-2',
        url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
        caption: 'Hand-roasted crispy lotus seeds prepared in small batches',
        tag: 'Batch Roasting'
      },
      {
        id: 'gp-3',
        url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        caption: 'Ethically harvested from natural freshwater ponds in Darbhanga, Bihar',
        tag: 'Farm Harvest'
      },
      {
        id: 'gp-4',
        url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
        caption: 'Guilt-free high-protein crunchy superfood snack for daily health',
        tag: 'Customer Moments'
      }
    ]
  },
  footerText: {
    about: 'Bringing you 100% natural, farm-fresh jumbo Phool Makhana from the pristine wetlands of Bihar. Crispy, high-protein superfood snacks for your healthy daily life.',
    qualityPromise: '100% Quality Guaranteed · Hygienic Sealed Packaging',
    craftedBy: 'From our heart to your bowl, crafted with Love by Saroj',
    copyright: 'All rights reserved.'
  },
  policies: {
    terms: `TERMS & CONDITIONS - MAKNUTS MAKHANA

1. Acceptance of Terms: By placing an order with Maknuts through our app or WhatsApp, you agree to these terms and conditions.
2. Orders & Confirmation: All orders placed via WhatsApp are subject to acceptance and availability. Once you send your order message, our team confirms the order and delivery timeframe.
3. Pricing & Delivery: Prices shown are in Indian Rupees (INR) and inclusive of applicable taxes. Delivery charges are calculated at checkout and communicated upfront.
4. Payments: Customers can pay manually via UPI (7504805846@ibl) or choose Cash on Delivery (COD) where available.
5. Delivery: We partner with reliable courier services. Most orders are dispatched within 24 to 48 business hours. Delivery typically takes 3 to 7 working days depending on location.`,
    privacy: `PRIVACY POLICY - MAKNUTS MAKHANA

1. Information We Collect: When you place an order, we collect your Name, Phone Number, Delivery Address, PIN code, and optional payment details solely to fulfill and ship your order.
2. WhatsApp Communication: We use your WhatsApp number to confirm order status, dispatch updates, and answer product queries.
3. Data Protection: We never sell, rent, or trade your personal information to third parties or marketing brokers.
4. Security: Your data is stored safely and used strictly for order logistics and customer support.
5. Inquiries: Contact us at maknutsmakhana@gmail.com or WhatsApp +91 78010 51792 for any privacy concerns.`,
    returns: `RETURN & REFUND POLICY - MAKNUTS MAKHANA

1. Freshness Guarantee: We take immense pride in delivering crisp, fresh, high-grade Makhana. If you receive damaged packaging or spoiled product, please contact us on WhatsApp (+91 78010 51792) within 48 hours of delivery.
2. Proof of Damage: Kindly share photos/videos of the package and order number.
3. Replacement / Refund: Once verified, we will dispatch a fresh replacement pouch or initiate a full refund to your UPI ID / bank account within 3 working days.
4. Non-returnable: As food products are perishable and hygienic items, opened or consumed packs cannot be returned unless verified defective on arrival.`,
    shipping: `SHIPPING & DISPATCH POLICY

1. Shipping Coverage: We deliver across pan-India to all serviceable postal PIN codes.
2. Dispatch Timeline: Orders placed before 2:00 PM are processed same day or next business morning.
3. Tracking: Courier tracking link is shared with you on WhatsApp once the shipment is handed to the courier.
4. Standard Delivery Time: 3-5 days for metro cities, 5-7 days for rest of India.`,
    cancellation: `ORDER CANCELLATION POLICY - MAKNUTS MAKHANA

1. Order Cancellation Window: You can cancel your order within 6 hours of placement or before dispatch by messaging our WhatsApp support (+91 78010 51792) with your Order ID.
2. Orders Already Dispatched: Once handed over to the courier partner, an order cannot be cancelled in transit. You may refuse delivery at the doorstep for COD orders or contact us for return verification.
3. Prepaid Refunds: For cancelled orders paid via UPI, full refund is credited back to your original source account within 2-3 business days.`
  },
  sectionVisibility: {
    announcementBar: true,
    headerNavigation: true,
    heroBanner: true,
    promoBanner: true,
    productShowcase: true,
    benefitsSection: true,
    foodCompliance: true,
    gallerySection: true,
    reviewsSection: true,
    faqSection: true,
    aboutSection: true,
    contactSection: true,
    floatingWhatsApp: true,
    footer: true,
  },
  sectionOrder: [
    'announcementBar',
    'headerNavigation',
    'heroBanner',
    'promoBanner',
    'productShowcase',
    'foodCompliance',
    'benefitsSection',
    'gallerySection',
    'reviewsSection',
    'faqSection',
    'footer'
  ],
  heroSection: {
    badge: '100% Mithila Origin · Direct Farm Harvest',
    heading: 'Crisp, Fluffy & Pure Jumbo Makhana',
    subheading: 'Direct from the pristine freshwater ponds of Darbhanga, Bihar. Handpicked 6+ Sutta grade fox nuts, slow-roasted to golden crunch perfection.',
    primaryCtaText: 'Shop Fresh Harvest',
    secondaryCtaText: 'Quick WhatsApp Order',
    bannerImage: defaultProductImage,
    trustChips: ['Farm Direct', 'No Preservatives', 'Zero Trans Fat', 'Rich in Protein'],
    showCtaButtons: true,
  },
  promoBanner: {
    enabled: true,
    badge: 'FESTIVE OFFER',
    title: 'Flat ₹50 OFF on Orders Above ₹499',
    description: 'Use coupon code MAKNUTS50 during checkout or mention on WhatsApp to get instant savings!',
    couponCodeBadge: 'MAKNUTS50',
    bgColor: 'emerald',
  },
  coupons: [
    {
      id: 'c-welcome10',
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 250,
      maxDiscount: 100,
      usageLimit: 500,
      usedCount: 0,
      perCustomerLimit: 1,
      enabled: true,
      firstOrderOnly: true,
      description: '10% off on your first order (Max ₹100)'
    },
    {
      id: 'c-maknuts50',
      code: 'MAKNUTS50',
      discountType: 'fixed',
      discountValue: 50,
      minOrderValue: 499,
      usageLimit: 1000,
      usedCount: 0,
      perCustomerLimit: 2,
      enabled: true,
      firstOrderOnly: false,
      description: 'Flat ₹50 off on orders of ₹499 and above'
    },
    {
      id: 'c-freeship',
      code: 'FREESHIP',
      discountType: 'free_delivery',
      discountValue: 0,
      minOrderValue: 300,
      usageLimit: 1000,
      usedCount: 0,
      perCustomerLimit: 3,
      enabled: true,
      firstOrderOnly: false,
      description: 'Free pan-India delivery on orders of ₹300 and above'
    }
  ],
  foodCompliance: {
    enabled: true,
    fssaiNumber: '',
    ingredients: '',
    allergens: '',
    isVeg: true,
    netQuantity: '250 g',
    shelfLife: '',
    storageInstructions: '',
    servingInstructions: '',
    countryOfOrigin: 'India',
    manufacturerName: '',
    manufacturerAddress: '',
    packerName: '',
    packerAddress: '',
    marketerName: '',
    marketerAddress: '',
    customerCarePhone: '+91 78010 51792',
    customerCareEmail: 'maknutsmakhana@gmail.com',
    customerCareAddress: 'Customer Care Desk, Maknuts Agri Foods, Darbhanga, Bihar, India - 846004',
    batchLotFormat: 'MK-BH-LOT',
    otherLegalDetails: '',
    nutrition: {
      servingSize: '100 g',
      energy: '',
      protein: '',
      carbohydrates: '',
      sugar: '',
      addedSugar: '',
      fat: '',
      saturatedFat: '',
      transFat: '',
      sodium: '',
      cholesterol: '',
      dietaryFiber: '',
      calcium: '',
      iron: '',
    },
    claims: {
      highProtein: false,
      glutenFree: false,
      noPreservatives: false,
      zeroTransFat: false,
      noAddedSugar: false,
      natural100: false,
      customClaims: []
    }
  },
  faqShowContactCallout: true,
  faqContactCalloutText: 'Still have queries?',
  faqContactButtonText: 'Chat with Makhana Specialist',
  faqs: [
    {
      id: 'faq-1',
      question: 'Where is Maknuts Makhana sourced from?',
      answer: 'All our Makhanas are harvested directly from traditional wetland ponds in the Mithila region (Darbhanga & Madhubani) of Bihar, known worldwide for producing the finest grade lotus seeds.',
      visible: true,
    },
    {
      id: 'faq-2',
      question: 'How are Maknuts Makhanas graded and processed?',
      answer: 'We exclusively select Jumbo 6+ Sutta grade seeds. They are sun-dried, hand-popped by traditional artisans, and slow-roasted in small batches to preserve optimal crunch and nutrients without chemical bleaching.',
      visible: true,
    },
    {
      id: 'faq-3',
      question: 'How do I pay and track my order?',
      answer: 'You can pay securely via instant UPI QR code or choose Cash on Delivery (COD). You receive an Order ID instantly, and can track your parcel live on our website or get courier updates directly on WhatsApp.',
      visible: true,
    },
    {
      id: 'faq-4',
      question: 'What is the shelf life and packaging?',
      answer: 'Our Makhanas have a 12-month shelf life. They are sealed in multi-layer moisture-lock zipper standee pouches so they stay fresh and crunchy even after unsealing.',
      visible: true,
    }
  ],
  seo: {
    pageTitle: 'Maknuts Makhana — 100% Pure Jumbo Fox Nuts from Bihar',
    metaDescription: 'Buy fresh, crispy Jumbo Grade Phool Makhana online direct from Mithila, Bihar farms. High protein, gluten-free, zero trans fat. Fast pan-India delivery & COD.',
    keywords: 'Maknuts, Makhana, Phool Makhana, Fox Nuts, Lotus Seeds, Bihar Makhana, Mithila Makhana, Healthy Snacks, High Protein Snack, Roasted Makhana',
    canonicalUrl: 'https://maknuts.com',
    ogTitle: 'Maknuts Makhana — 100% Pure Jumbo Fox Nuts from Bihar',
    ogDescription: 'Buy fresh, crispy Jumbo Grade Phool Makhana online direct from Mithila, Bihar farms. High protein, gluten-free, zero trans fat. Fast pan-India delivery & COD.',
    ogImage: defaultProductImage,
    twitterCard: 'summary_large_image',
    productSeoTitle: 'Maknuts Jumbo Grade Fox Nuts 250g Pouch',
    productDescription: 'Naturally roasted jumbo lotus seeds handpicked from Bihar wetlands. Crunchy, protein-rich, zero preservatives.',
    imageAltText: 'Maknuts Premium Jumbo Grade Makhana Pouch',
  },
  whatsAppSettings: {
    businessNumber: '917801051792',
    supportNumber: '917801051792',
    orderTemplate: '🌿 *NEW ORDER - MAKNUTS* 🌿\n\n📦 *Order ID:* {{orderId}}\n👤 *Name:* {{customerName}}\n🛒 *Product:* {{productName}} (Qty: {{quantity}})\n💰 *Total:* ₹{{total}}\n💳 *Payment Method:* {{paymentMethod}}\n{{utr}}\n\nPlease confirm my order and send dispatch details. Thank you!',
    paymentTemplate: 'Hi {{customerName}}, we have received your payment of ₹{{total}} for Order #{{orderId}}. Your fresh harvest Makhana is scheduled for dispatch.',
    supportTemplate: 'Hello Maknuts Support! I have a question regarding an order or product quality.',
    enabled: true,
    enableFloatingButton: true,
  },
  socialLinks: {
    instagram: 'https://instagram.com/maknutsmakhana',
    facebook: 'https://facebook.com/maknutsmakhana',
    youtube: '',
    twitter: '',
  },
  mediaLibrary: [
    { id: 'm-logo', url: defaultProductImage, label: 'Default Maknuts Logo', tag: 'logo' },
    { id: 'm-hero-1', url: defaultProductImage, label: 'Makhana Pouch Standee', tag: 'hero' },
    { id: 'm-bowl', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', label: 'Crisp Roasted Bowl', tag: 'product' },
    { id: 'm-farm', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', label: 'Wetland Harvest Pond', tag: 'gallery' },
  ]
};
