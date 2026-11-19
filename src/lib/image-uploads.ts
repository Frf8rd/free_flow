export function createImageUrls(files: File[]): string[] {
  return files.map((file) => URL.createObjectURL(file));
}

export function createImageFormData(
  fields: Record<string, string | number | string[] | undefined>,
  files: File[],
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
  }
  for (const file of files) formData.append("images", file, file.name);
  return formData;
}
