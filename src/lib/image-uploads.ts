export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAcceptedImageType(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.has(file.type);
}

export function createImageUrls(files: File[]): string[] {
  return files.map((file) => URL.createObjectURL(file));
}

export function createImageFormData(
  fields: Record<string, string | number | boolean | string[] | undefined>,
  files: File[],
  fileFieldName = "images",
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
  }
  for (const file of files) formData.append(fileFieldName, file, file.name);
  return formData;
}
