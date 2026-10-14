import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImageFile } from './imageCompressor';

/**
 * Uploads an image file or blob to Firebase Storage.
 * Returns the public persistent download URL.
 * Falls back to optimized compressed base64 data URL if storage upload is unavailable.
 */
export async function uploadImageToStorage(
  file: File | Blob, 
  folder: string = 'media',
  fileName?: string
): Promise<string> {
  const safeName = fileName || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
  const storagePath = `${folder}/${safeName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageErr) {
    console.warn('Firebase Storage direct upload failed, using local high-efficiency compression fallback:', storageErr);
    // Fallback: If File, compress to lightweight webp/jpeg data URL
    if (file instanceof File) {
      try {
        const compressed = await compressImageFile(file, 900, 0.75, 50000);
        return compressed;
      } catch (compErr) {
        console.error('Compression fallback failed:', compErr);
      }
    }
    // Return object URL if everything else fails
    return URL.createObjectURL(file);
  }
}
