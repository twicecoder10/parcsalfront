import { api, ApiResponse, extractData } from './api';

// Image validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_PARCEL_IMAGES = 10;
export const MAX_PROOF_IMAGES = 5;

// Validation helper
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File ${file.name} is too large. Maximum size is 10MB.` };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File ${file.name} is not a supported image format. Only JPEG, PNG, WebP, and GIF are allowed.`,
    };
  }

  return { valid: true };
}

// Upload parcel images (for customers)
export async function uploadParcelImages(files: File[]): Promise<string[]> {
  // Validate files
  if (files.length === 0) {
    throw new Error('Please select at least one image');
  }

  if (files.length > MAX_PARCEL_IMAGES) {
    throw new Error(`Maximum ${MAX_PARCEL_IMAGES} images allowed`);
  }

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // Create FormData
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  // Upload images
  const response = await api.post<ApiResponse<{ images: string[]; count: number }>>(
    '/uploads/parcel-images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'Failed to upload images');
  }

  return response.data.data?.images || [];
}

// Upload proof images (for companies)
export async function uploadProofImages(files: File[]): Promise<string[]> {
  // Validate files
  if (files.length === 0) {
    throw new Error('Please select at least one image');
  }

  if (files.length > MAX_PROOF_IMAGES) {
    throw new Error(`Maximum ${MAX_PROOF_IMAGES} proof images allowed`);
  }

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // Create FormData
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  // Upload images
  const response = await api.post<ApiResponse<{ images: string[]; count: number }>>(
    '/uploads/proof-images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'Failed to upload proof images');
  }

  return response.data.data?.images || [];
}

// Upload company logo (uses proof image endpoint as workaround)
export async function uploadCompanyLogo(file: File): Promise<string> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('images', file);

  // Upload image (using proof image endpoint as workaround)
  const response = await api.post<ApiResponse<{ images: string[]; count: number }>>(
    '/uploads/proof-images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'Failed to upload logo');
  }

  const images = response.data.data?.images || [];
  if (images.length === 0) {
    throw new Error('No image URL returned from upload');
  }

  return images[0];
}

// Helper to create image preview URL
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

