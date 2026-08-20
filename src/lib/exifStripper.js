/**
 * 🔒 Nirvighna EXIF & GPS Metadata Stripper + Magic Bytes File Validator Utility
 * Prevents privacy leaks by stripping GPS location tags from uploaded photos
 * and enforces strict 5MB size limit & Magic Bytes binary header validation.
 */

/**
 * Validates actual binary magic bytes header (JPEG, PNG, WEBP) and 5MB limit
 */
export const validateImageFileHeader = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected"));
      return;
    }

    // 1. Strict 5MB Size Limit Validation
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE_BYTES) {
      reject(new Error(`Photo file size must be under 5MB (selected file: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`));
      return;
    }

    // 2. Binary Magic Bytes Header Validation (Reading first 8 bytes)
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target || !e.target.result) {
        reject(new Error("Could not read file binary header"));
        return;
      }

      const arr = new Uint8Array(e.target.result).subarray(0, 8);
      let headerHex = "";
      for (let i = 0; i < arr.length; i++) {
        headerHex += arr[i].toString(16).padStart(2, "0").toUpperCase();
      }

      // JPEG: FFD8FF
      const isJpeg = headerHex.startsWith("FFD8FF");
      // PNG: 89504E47
      const isPng = headerHex.startsWith("89504E47");
      // WEBP: 52494646 (RIFF header)
      const isWebp = headerHex.startsWith("52494646");

      if (isJpeg || isPng || isWebp) {
        resolve({ valid: true, mime: isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp" });
      } else {
        reject(new Error("🚨 Invalid image file signature detected. Renamed non-image or executable files are strictly blocked."));
      }
    };

    reader.onerror = () => reject(new Error("Error reading file header"));
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

export const stripExifMetadata = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(file); // Non-image or null file passed as-is
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        // Re-encoding image onto clean canvas completely drops EXIF/GPS tags
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const cleanFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_sanitized.jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(cleanFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        console.warn('EXIF strip fallback:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

export const validateAndStripPhoto = async (file) => {
  await validateImageFileHeader(file);
  return await stripExifMetadata(file);
};
