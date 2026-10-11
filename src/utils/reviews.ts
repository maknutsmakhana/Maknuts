import { ReviewItem } from '../types';

export interface ReviewStats {
  averageRating: number; // e.g. 4.8 (rounded to 1 decimal place)
  totalReviews: number;
  starCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  hasReviews: boolean;
  displayText: string; // e.g. "4.8 / 5.0" or "No reviews yet."
}

/**
 * Automatically calculate rating statistics from APPROVED reviews only.
 * - Average rating rounded to 1 decimal place
 * - Total review count
 * - 5, 4, 3, 2, 1 star counts
 * - If no approved reviews exist: returns hasReviews: false, displayText: "No reviews yet."
 */
export function calculateReviewStats(reviews: ReviewItem[] | undefined | null): ReviewStats {
  const list = Array.isArray(reviews) ? reviews : [];
  // Strictly filter for approved reviews only
  const approved = list.filter(r => (r.status || 'approved') === 'approved');
  const total = approved.length;

  const starCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (total === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      starCounts,
      hasReviews: false,
      displayText: 'No reviews yet.',
    };
  }

  let sum = 0;
  for (const r of approved) {
    const raw = Number(r.rating) || 5;
    const clamped = Math.min(5, Math.max(1, Math.round(raw))) as 1 | 2 | 3 | 4 | 5;
    starCounts[clamped] = (starCounts[clamped] || 0) + 1;
    sum += clamped;
  }

  // Consistent 1 decimal place rounding
  const avg = Math.round((sum / total) * 10) / 10;

  return {
    averageRating: avg,
    totalReviews: total,
    starCounts,
    hasReviews: true,
    displayText: `${avg.toFixed(1)} / 5.0`,
  };
}

/**
 * Validate customer review input before submission.
 */
export function validateReviewForm(data: {
  name: string;
  rating: number;
  comment: string;
}): { isValid: boolean; error?: string } {
  const trimmedName = (data.name || '').trim();
  const trimmedComment = (data.comment || '').trim();
  const ratingNum = Number(data.rating);

  if (!trimmedName || trimmedName.length < 2) {
    return { isValid: false, error: 'Please enter your name (minimum 2 characters).' };
  }
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { isValid: false, error: 'Please select a rating between 1 and 5 stars.' };
  }
  if (!trimmedComment || trimmedComment.length < 3) {
    return { isValid: false, error: 'Please enter your review / feedback comments.' };
  }
  if (trimmedComment.length > 2000) {
    return { isValid: false, error: 'Review text exceeds maximum allowed length of 2000 characters.' };
  }

  return { isValid: true };
}

/**
 * Client-side anti-spam / cooldown check:
 * Prevents rapid accidental or malicious duplicate submissions within 30 seconds.
 */
const LAST_SUBMISSION_KEY = 'maknuts_last_review_submit';
const COOLDOWN_SECONDS = 20;

export function checkReviewCooldown(): { allowed: boolean; waitSeconds?: number } {
  try {
    const last = localStorage.getItem(LAST_SUBMISSION_KEY);
    if (last) {
      const elapsedMs = Date.now() - Number(last);
      const remainingSec = Math.ceil((COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);
      if (remainingSec > 0) {
        return { allowed: false, waitSeconds: remainingSec };
      }
    }
  } catch {
    // Local storage unavailable
  }
  return { allowed: true };
}

export function recordReviewSubmission(): void {
  try {
    localStorage.setItem(LAST_SUBMISSION_KEY, String(Date.now()));
  } catch {
    // Non-fatal
  }
}
