import { CollectibleData } from '../types';

/**
 * Converts a blob URL to a base64 encoded data URL
 * @param blobUrl The blob URL to convert
 * @returns Promise resolving to a base64 data URL
 */
export const blobToBase64 = async (blobUrl: string): Promise<string> => {
  // Skip if not a blob URL
  if (!blobUrl.startsWith('blob:')) {
    return blobUrl;
  }

  try {
    // Fetch the blob data
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Convert blob to base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to convert blob to base64'));
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob to base64:', error);
    // Re-throw the error instead of returning the original URL
    throw error;
  }
};

/**
 * Revokes a blob URL to prevent memory leaks
 * @param url The URL to revoke if it's a blob URL
 */
export const revokeBlobUrl = (url: string | undefined): void => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }
};

/**
 * Processes all image URLs in an item, converting blob URLs to base64
 * @param item The collectible item containing image URLs
 * @returns Promise resolving to the item with converted image URLs
 */
export const processItemImages = async (item: Partial<CollectibleData>): Promise<Partial<CollectibleData>> => {
  try {
    const updatedItem = { ...item };
    
    // Process primary image if it exists
    if (updatedItem.primaryImage) {
      updatedItem.primaryImage = await blobToBase64(updatedItem.primaryImage);
    }
    
    // Process thumbnail image if it exists
    if (updatedItem.thumbnailImage) {
      updatedItem.thumbnailImage = await blobToBase64(updatedItem.thumbnailImage);
    }
    
    // Process additional images if they exist
    if (updatedItem.additionalImages && updatedItem.additionalImages.length > 0) {
      const convertedAdditionalImages = await Promise.all(
        updatedItem.additionalImages.map(url => blobToBase64(url))
      );
      updatedItem.additionalImages = convertedAdditionalImages;
    }
    
    return updatedItem;
  } catch (error) {
    console.error('Error processing item images:', error);
    // Re-throw the error to prevent saving invalid data
    throw error;
  }
};

/**
 * Cleans up all blob URLs in an item to prevent memory leaks
 * @param item The collectible item containing image URLs to clean up
 */
export const cleanupItemBlobUrls = (item: Partial<CollectibleData>): void => {
  try {
    // Revoke primary image if it's a blob URL
    if (item.primaryImage) {
      revokeBlobUrl(item.primaryImage);
    }
    
    // Revoke thumbnail image if it's a blob URL
    if (item.thumbnailImage) {
      revokeBlobUrl(item.thumbnailImage);
    }
    
    // Revoke additional images if they're blob URLs
    if (item.additionalImages && item.additionalImages.length > 0) {
      item.additionalImages.forEach(url => revokeBlobUrl(url));
    }
  } catch (error) {
    console.error('Error cleaning up item blob URLs:', error);
  }
};