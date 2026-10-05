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
  adminPassword: 'maknuts123',
  buttons: {
    buyNow: 'Buy Now',
    whatsappOrder: 'PLACE ORDER ON WHATSAPP',
    copyUpi: 'Copy UPI ID',
    chatWhatsApp: 'Chat on WhatsApp',
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
