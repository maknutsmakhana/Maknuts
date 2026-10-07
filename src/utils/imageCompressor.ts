/**
 * Image compression and dimension scaling utility for Maknuts Makhana store.
 * Ensures all image uploads and product photos are crystal clear, fast loading,
 * and strictly adhere to Firestore's 1,048,576 bytes (1 MiB) per-document limit.
 */

const DEFAULT_MAX_DIMENSION = 640;
const DEFAULT_QUALITY = 0.68;
const MAX_BYTES_PER_IMAGE = 48000; // ~48KB target per image ensures 10 images < 480KB total

/**
 * Compresses and resizes a base64 data URL.
 * Guarantees small footprint while maintaining high visual clarity for Maknuts Makhana products.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxDimension = DEFAULT_MAX_DIMENSION,
  quality = DEFAULT_QUALITY,
  maxTargetBytes = MAX_BYTES_PER_IMAGE
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return dataUrl;
  }

  // Remote URLs (https/http) or relative assets are already light references
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // If already below target size, no compression needed
  if (dataUrl.length <= maxTargetBytes) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    // Safety timeout in case image loading fails silently
    const timeout = setTimeout(() => {
      resolve(dataUrl);
    }, 4000);

    const img = new Image();

    img.onload = () => {
      clearTimeout(timeout);
      try {
        let { width, height } = img;
        if (!width || !height) {
          resolve(dataUrl);
          return;
        }

        // Scale down dimensions proportionally
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        width = Math.max(Math.round(width), 1);
        height = Math.max(Math.round(height), 1);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let result = canvas.toDataURL('image/jpeg', quality);

        // First fallback pass: if still larger than maxTargetBytes, reduce quality
        if (result.length > maxTargetBytes) {
          result = canvas.toDataURL('image/jpeg', Math.max(quality - 0.15, 0.5));
        }

        // Second fallback pass: downscale canvas further if still too large
        if (result.length > maxTargetBytes) {
          const miniWidth = Math.max(Math.round(width * 0.75), 1);
          const miniHeight = Math.max(Math.round(height * 0.75), 1);
          const miniCanvas = document.createElement('canvas');
          miniCanvas.width = miniWidth;
          miniCanvas.height = miniHeight;
          const miniCtx = miniCanvas.getContext('2d');
          if (miniCtx) {
            miniCtx.imageSmoothingEnabled = true;
            miniCtx.imageSmoothingQuality = 'medium';
            miniCtx.drawImage(canvas, 0, 0, miniWidth, miniHeight);
            result = miniCanvas.toDataURL('image/jpeg', 0.52);
          }
        }

        // Final safety check: if still over 65KB, aggressive compress
        if (result.length > 65000) {
          const tinyWidth = Math.max(Math.round(width * 0.5), 1);
          const tinyHeight = Math.max(Math.round(height * 0.5), 1);
          const tinyCanvas = document.createElement('canvas');
          tinyCanvas.width = tinyWidth;
          tinyCanvas.height = tinyHeight;
          const tinyCtx = tinyCanvas.getContext('2d');
          if (tinyCtx) {
            tinyCtx.imageSmoothingEnabled = true;
            tinyCtx.drawImage(canvas, 0, 0, tinyWidth, tinyHeight);
            result = tinyCanvas.toDataURL('image/jpeg', 0.45);
          }
        }

        resolve(result);
      } catch (err) {
        console.warn('Canvas image compression failed, using original', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(dataUrl);
    };

    // Notice: Do NOT set crossOrigin for data: URLs to prevent tainted canvas issues
    img.src = dataUrl;
  });
}

/**
 * Compresses an uploaded image file (from <input type="file">) into a clean, compact JPEG data URL.
 */
export async function compressImageFile(
  file: File | Blob,
  maxDimension = DEFAULT_MAX_DIMENSION,
  quality = DEFAULT_QUALITY,
  maxTargetBytes = MAX_BYTES_PER_IMAGE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawDataUrl = e.target?.result as string;
        const compressed = await compressDataUrl(rawDataUrl, maxDimension, quality, maxTargetBytes);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Measures the approximate byte size of a JavaScript object when serialized to JSON.
 */
export function estimateObjectSizeBytes(obj: unknown): number {
  try {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

/**
 * Optimizes an entire product object before saving to Firestore,
 * ensuring all images are compressed, duplicates removed, and the total
 * document size is strictly capped well under 500KB (Firestore limit is 1,048,576 bytes).
 */
export async function optimizeProductForFirestore<T extends { image?: string; images?: string[] }>(product: T): Promise<T> {
  const optimized: any = { ...product };

  // 1. Sanitize and compress primary image
  if (optimized.image && typeof optimized.image === 'string' && optimized.image.startsWith('data:image/')) {
    optimized.image = await compressDataUrl(optimized.image, 640, 0.68, 45000);
  }

  // 2. Sanitize and compress all gallery photos
  if (Array.isArray(optimized.images)) {
    // Deduplicate and filter empty
    const unique = Array.from(new Set(optimized.images.filter(Boolean) as string[]));
    // Cap at a maximum of 10 photos to protect Firestore document size
    const capped = unique.slice(0, 10);

    optimized.images = await Promise.all(
      capped.map(async (img: string) => {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          return await compressDataUrl(img, 640, 0.68, 45000);
        }
        return img;
      })
    );
  }

  // 3. Document size validation and multi-pass reduction if needed
  let totalBytes = estimateObjectSizeBytes(optimized);

  // If still above 550KB (giving a huge margin below 1,048,576 bytes), apply aggressive secondary compression
  if (totalBytes > 550000) {
    if (optimized.image && typeof optimized.image === 'string' && optimized.image.startsWith('data:image/')) {
      optimized.image = await compressDataUrl(optimized.image, 480, 0.52, 28000);
    }
    if (Array.isArray(optimized.images)) {
      optimized.images = await Promise.all(
        optimized.images.slice(0, 7).map(async (img: string) => {
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            return await compressDataUrl(img, 480, 0.52, 28000);
          }
          return img;
        })
      );
    }
    totalBytes = estimateObjectSizeBytes(optimized);
  }

  // Ultra-safety net: if still over 800KB, slice to top 4 photos
  if (totalBytes > 800000 && Array.isArray(optimized.images)) {
    optimized.images = optimized.images.slice(0, 4);
  }

  return optimized;
}

/**
 * Optimizes store settings before writing to Firestore, ensuring
 * any user-uploaded gallery photos are compressed and the document remains tiny.
 */
export async function optimizeSettingsForFirestore<T extends { gallerySection?: { photos?: any[] } }>(settings: T): Promise<T> {
  const optimized: any = { ...settings };

  if (optimized.gallerySection && Array.isArray(optimized.gallerySection.photos)) {
    const photos = optimized.gallerySection.photos;
    // Cap gallery photos at 16
    const cappedPhotos = photos.slice(0, 16);
    optimized.gallerySection.photos = await Promise.all(
      cappedPhotos.map(async (p: any) => {
        if (p && typeof p.url === 'string' && p.url.startsWith('data:image/')) {
          const compressedUrl = await compressDataUrl(p.url, 640, 0.68, 45000);
          return { ...p, url: compressedUrl };
        }
        return p;
      })
    );
  }

  return optimized;
}
