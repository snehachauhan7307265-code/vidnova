export const CLOUDINARY_CLOUD_NAME = 'fal81qe5';
export const CLOUDINARY_API_KEY = '886683179967593';
export const CLOUDINARY_API_SECRET = 'AdaFVDrdgIb5jCS2fOshfOj5G1Y';

export async function generateSHA1(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadToCloudinary(file: File, resourceType: 'video' | 'image', onProgress?: (p: number) => void): Promise<{ secure_url: string, public_id: string, duration?: number }> {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await generateSHA1(signatureString);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
}
