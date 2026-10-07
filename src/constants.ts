import { Product, StoreSettings } from './types';
import defaultProductImage from './assets/images/maknuts_makhana_pouch_1791179105818.jpg';

export const DEFAULT_PRODUCT: Product = {
  id: 'maknuts-makhana-jumbo-250g',
  name: 'Maknuts Makhana',
  tagline: '100% Premium Bihar Fox Nuts · Handpicked Jumbo Grade',
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
  stockStatusText: 'In Stock - Ready to Dispatch',
  badge: 'Premium Handpicked',
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
  upiId: '7504805846@ibl',
  upiPayeeName: 'Maknuts Makhana',
  enableUpi: true,
  enableCod: true,
  whatsappNumber: '+91 78010 51792',
  supportPhone: '+91 78010 51792',
  supportEmail: 'maknutsmakhana@gmail.com',
  address: 'Maknuts Agri Foods, Darbhanga, Bihar, India - 846004',
  supportHours: 'Mon - Sun: 9:00 AM - 9:00 PM',
  adminPassword: 'maknuts123',
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
    ratingText: '4.9 / 5.0',
    guaranteeBadge: '100% Satisfaction or Easy Replacement',
    reviews: [
      {
        id: 'r-1',
        name: 'Priya Verma',
        location: 'Bangalore',
        rating: 5,
        category: 'Taste & Crunch Quality',
        comment: 'The size of the makhanas is truly jumbo! No burnt pieces, super crunchy, and lightly salted taste is pure perfection for my daily evening snack.'
      },
      {
        id: 'r-2',
        name: 'Amit K.',
        location: 'New Delhi',
        rating: 5,
        category: 'Delivery & Shipping Speed',
        comment: 'Ordering on WhatsApp was surprisingly fast and effortless. Sent the message, paid via UPI, and got courier tracking the next day. Top quality.'
      },
      {
        id: 'r-3',
        name: 'Sunita Mishra',
        location: 'Patna',
        rating: 5,
        category: 'Packaging & Seal',
        comment: "Best makhana I've tasted in months. You can feel the freshness right after opening the zipper seal. My parents love having it with their morning tea."
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
4. Standard Delivery Time: 3-5 days for metro cities, 5-7 days for rest of India.`
  }
};
