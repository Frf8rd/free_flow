import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/common/ImagePreview";
import { useI18n } from "@/i18n";
import { isAcceptedImageType, MAX_IMAGE_SIZE_BYTES } from "@/lib/image-uploads";

const MAX_IMAGE_COUNT = 5;

interface ImageUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingImageUrls?: string[];
  label?: string;
  compact?: boolean;
}

export function ImageUpload({
  files,
  onFilesChange,
  existingImageUrls = [],
  label,
  compact = false,
}: ImageUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const totalCount = files.length + existingImageUrls.length;
  const uploadLabel = label ?? t("upload.images");

  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    const accepted: File[] = [];
    let validationError: string | null = null;

    for (const file of selected) {
      if (!isAcceptedImageType(file)) {
        validationError ??= t("upload.invalidType");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        validationError ??= t("upload.tooLarge");
        continue;
      }
      if (totalCount + accepted.length >= MAX_IMAGE_COUNT) {
        validationError ??= t("upload.tooMany");
        break;
      }
      accepted.push(file);
    }

    setError(validationError);
    if (accepted.length) onFilesChange([...files, ...accepted]);
    event.currentTarget.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{uploadLabel}</p>
          {!compact && <p className="mt-1 text-xs text-muted-foreground">{t("upload.help")}</p>}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={totalCount >= MAX_IMAGE_COUNT}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus aria-hidden />
          {t("upload.addImages")}
        </Button>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          tabIndex={-1}
          className="sr-only"
          aria-label={uploadLabel}
          onChange={addFiles}
        />
      </div>
      {error && (
        <p role="alert" className="text-small text-destructive">
          {error}
        </p>
      )}
      {totalCount > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {existingImageUrls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="overflow-hidden rounded-[var(--radius-item)] border border-border"
            >
              <ImagePreview
                src={url}
                alt={`${t("upload.image")} ${index + 1}`}
                className="w-full rounded-none"
                imageClassName="aspect-square w-full object-cover"
              />
            </li>
          ))}
          {previews.map(({ file, url }, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="relative overflow-hidden rounded-[var(--radius-item)] border border-border"
            >
              <ImagePreview
                src={url}
                alt={file.name}
                className="w-full rounded-none"
                imageClassName="aspect-square w-full object-cover"
              />
              <Button
                type="button"
                size="iconSm"
                variant="secondary"
                className="absolute right-1 top-1"
                aria-label={`${t("upload.removeImage")} ${file.name}`}
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                <X aria-hidden />
              </Button>
              <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{file.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
