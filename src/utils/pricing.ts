import { StoreSettings, Coupon } from '../types';

/**
 * Currency rounding helper: round to 2 decimal places consistently
 */
export function round2(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export interface PricingCalculationResult {
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  baseAmount: number; // unitPrice * quantity
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountAmount: number; // general store discount deduction
  couponCode?: string;
  couponDiscount: number; // additional coupon discount deduction
  couponDescription?: string;
  subtotal: number; // baseAmount - general discount - coupon discount (>= 0)
  deliveryCharge: number; // 0 if free delivery eligible, else configured charge
  isFreeDelivery: boolean;
  finalTotal: number; // subtotal + deliveryCharge (>= 0)
  totalSavings: number; // savings compared to originalPrice + discounts
}

export interface OrderPricingInput {
  productPrice: number;
  originalPrice?: number;
  quantity: number;
  settings: StoreSettings;
  appliedCoupon?: Coupon | null;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  isFreeDelivery: boolean;
  errorMessage?: string;
}

/**
 * Validates a coupon code against store coupon rules securely.
 */
export function validateAndApplyCoupon(
  code: string,
  coupons: Coupon[] = [],
  baseAmount: number,
  productId?: string,
  customerPhone?: string
): CouponValidationResult {
  if (!code || !code.trim()) {
    return { isValid: false, discountAmount: 0, isFreeDelivery: false, errorMessage: 'Please enter a coupon code' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = coupons.find(c => c.code.trim().toUpperCase() === cleanCode);

  if (!coupon) {
    return { isValid: false, discountAmount: 0, isFreeDelivery: false, errorMessage: `Coupon "${cleanCode}" is invalid` };
  }

  if (!coupon.enabled) {
    return { isValid: false, discountAmount: 0, isFreeDelivery: false, errorMessage: `Coupon "${cleanCode}" is no longer active` };
  }

  // Date validity check
  const todayStr = new Date().toISOString().split('T')[0];
  if (coupon.startDate && coupon.startDate > todayStr) {
    return { isValid: false, discountAmount: 0, isFreeDelivery: false, errorMessage: `Coupon "${cleanCode}" starts on ${coupon.startDate}` };
  }

  if (coupon.expiryDate && coupon.expiryDate < todayStr) {
    return { isValid: false, discountAmount: 0, isFreeDelivery: false, errorMessage: `Coupon "${cleanCode}" has expired` };
  }

  // Minimum Order Value check
  if (coupon.minOrderValue && baseAmount < coupon.minOrderValue) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeDelivery: false,
      errorMessage: `Minimum order value of ₹${coupon.minOrderValue} required for coupon "${cleanCode}"`
    };
  }

  // Product specific check
  if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0 && productId) {
    if (!coupon.applicableProductIds.includes(productId)) {
      return {
        isValid: false,
        discountAmount: 0,
        isFreeDelivery: false,
        errorMessage: `Coupon "${cleanCode}" is not applicable on this product`
      };
    }
  }

  // Usage limit check
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeDelivery: false,
      errorMessage: `Coupon "${cleanCode}" usage limit has been reached`
    };
  }

  // Calculate discount based on coupon type
  let discountAmount = 0;
  let isFreeDelivery = false;

  if (coupon.discountType === 'percentage') {
    const rawDisc = (baseAmount * coupon.discountValue) / 100;
    discountAmount = round2(coupon.maxDiscount ? Math.min(rawDisc, coupon.maxDiscount) : rawDisc);
  } else if (coupon.discountType === 'fixed') {
    discountAmount = round2(Math.min(coupon.discountValue, baseAmount));
  } else if (coupon.discountType === 'free_delivery') {
    isFreeDelivery = true;
    discountAmount = 0;
  }

  // Prevent discount making order negative
  discountAmount = Math.min(discountAmount, baseAmount);

  return {
    isValid: true,
    coupon,
    discountAmount,
    isFreeDelivery
  };
}

/**
 * Centralized order calculation function.
 * Used identically across checkout, cart, WhatsApp message, order records, and admin dashboard.
 */
export function calculateOrderPricing(input: OrderPricingInput): PricingCalculationResult {
  const { productPrice, originalPrice, quantity, settings, appliedCoupon } = input;

  // 1. Quantity validation & bounds
  const minQty = Math.max(1, settings?.minOrderQuantity || 1);
  const maxQty = Math.max(minQty, settings?.maxOrderQuantity || 20);
  const rawQty = Math.floor(Number(quantity) || minQty);
  const validQty = Math.min(Math.max(rawQty, minQty), maxQty);

  // 2. Unit price & MRP (Original price)
  const unitPrice = Math.max(0, round2(Number(productPrice) || 0));
  const mrp = Math.max(unitPrice, round2(Number(originalPrice) || unitPrice));

  // 3. Base Amount = Product Price × Quantity
  const baseAmount = round2(unitPrice * validQty);

  // 4. General store discount calculation
  let discountAmount = 0;
  let discountType: 'percentage' | 'fixed' | 'none' = 'none';
  let discountValue = 0;

  if (settings?.discountEnabled && settings.discountValue > 0 && baseAmount > 0) {
    if (settings.discountType === 'percentage') {
      discountType = 'percentage';
      const pct = Math.min(100, Math.max(0, round2(settings.discountValue)));
      discountValue = pct;
      discountAmount = round2((baseAmount * pct) / 100);
    } else {
      discountType = 'fixed';
      const fixed = Math.max(0, round2(settings.discountValue));
      discountValue = fixed;
      discountAmount = round2(Math.min(fixed, baseAmount));
    }
  }

  // 5. Coupon discount calculation
  let couponDiscount = 0;
  let couponFreeDelivery = false;
  let couponCode: string | undefined = undefined;
  let couponDescription: string | undefined = undefined;

  if (appliedCoupon && appliedCoupon.enabled) {
    const couponValidation = validateAndApplyCoupon(
      appliedCoupon.code,
      [appliedCoupon],
      Math.max(0, baseAmount - discountAmount)
    );
    if (couponValidation.isValid) {
      couponDiscount = couponValidation.discountAmount;
      couponFreeDelivery = couponValidation.isFreeDelivery;
      couponCode = appliedCoupon.code;
      couponDescription = appliedCoupon.description || `${appliedCoupon.code} applied`;
    }
  }

  // 6. Subtotal = Base Amount − Store Discount - Coupon Discount (never negative)
  const totalDeductions = round2(discountAmount + couponDiscount);
  const subtotal = Math.max(0, round2(baseAmount - totalDeductions));

  // 7. Delivery Charge calculation
  let deliveryCharge = 0;
  let isFreeDelivery = false;

  const configuredDelivery = Math.max(0, round2(settings?.deliveryCharge ?? 0));
  const freeThreshold = Math.max(0, round2(settings?.freeDeliveryThreshold ?? 0));
  const freeAllOrders = Boolean(settings?.freeDeliveryAllOrders);

  if (couponFreeDelivery || freeAllOrders || configuredDelivery === 0) {
    deliveryCharge = 0;
    isFreeDelivery = true;
  } else if (freeThreshold > 0 && subtotal >= freeThreshold) {
    deliveryCharge = 0;
    isFreeDelivery = true;
  } else {
    deliveryCharge = configuredDelivery;
    isFreeDelivery = false;
  }

  // 8. Final Total = Subtotal + Delivery Charge (never negative)
  const finalTotal = Math.max(0, round2(subtotal + deliveryCharge));

  // 9. Total customer savings
  const mrpTotal = round2(mrp * validQty);
  const mrpDiscount = Math.max(0, round2(mrpTotal - baseAmount));
  const totalSavings = round2(mrpDiscount + discountAmount + couponDiscount + (isFreeDelivery && configuredDelivery > 0 ? configuredDelivery : 0));

  return {
    unitPrice,
    originalPrice: mrp,
    quantity: validQty,
    baseAmount,
    discountType,
    discountValue,
    discountAmount,
    couponCode,
    couponDiscount,
    couponDescription,
    subtotal,
    deliveryCharge,
    isFreeDelivery,
    finalTotal,
    totalSavings,
  };
}

/**
 * Generates a unique customer-friendly Order ID, for example: "MK-261008-A7F3"
 * - Admin can customize the prefix (default "MK")
 * - Does not require loading prior orders (zero race condition / collision safe)
 * - Includes YYMMDD date code + 4 random hex entropy
 */
export function generateUniqueOrderId(prefix: string = 'MK'): string {
  const cleanPrefix = (prefix || 'MK').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MK';
  
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;

  // 4 cryptographically sound random hex characters
  let randomPart = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(2);
    crypto.getRandomValues(arr);
    randomPart = Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  } else {
    randomPart = Math.random().toString(16).substring(2, 6).toUpperCase();
  }

  // Ensure exact 4 uppercase characters
  randomPart = (randomPart + 'A1B2').slice(0, 4);

  return `${cleanPrefix}-${datePart}-${randomPart}`;
}

/**
 * Validates financial input to avoid NaN, negative numbers, or invalid ranges.
 */
export function validatePriceInput(val: any, min = 0, max = 1000000): { isValid: boolean; value: number; error?: string } {
  const num = Number(val);
  if (val === '' || val === null || val === undefined || isNaN(num)) {
    return { isValid: false, value: 0, error: 'Value must be a valid number' };
  }
  if (!isFinite(num)) {
    return { isValid: false, value: 0, error: 'Value must be finite' };
  }
  if (num < min) {
    return { isValid: false, value: min, error: `Value cannot be less than ${min}` };
  }
  if (num > max) {
    return { isValid: false, value: max, error: `Value cannot exceed ${max}` };
  }
  return { isValid: true, value: round2(num) };
}
