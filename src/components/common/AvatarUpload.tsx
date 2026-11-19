import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { ImagePreview } from "@/components/common/ImagePreview";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { initials } from "@/lib/format";
import { isAcceptedImageType, MAX_IMAGE_SIZE_BYTES } from "@/lib/image-uploads";

interface AvatarUploadProps {
  name: string;
  imageUrl?: string | undefined;
  file: File | null;
  removeAvatar: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
}

export function AvatarUpload({
  name,
  imageUrl,
  file,
  removeAvatar,
  onFileChange,
  onRemove,
}: AvatarUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const displayedUrl = removeAvatar ? undefined : previewUrl;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(imageUrl);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, imageUrl]);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selected) return;
    if (!isAcceptedImageType(selected)) {
      setError(t("profile.avatarType"));
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE_BYTES) {
      setError(t("profile.avatarSize"));
      return;
    }
    setError(null);
    onFileChange(selected);
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      {displayedUrl ? (
        <ImagePreview
          src={displayedUrl}
          alt={`${name} · ${t("profile.avatar")}`}
          className="size-20 rounded-full"
          imageClassName="size-20 object-cover"
        />
      ) : (
        <Avatar className="size-20 bg-primary-soft text-xl text-primary-soft-foreground">
          <AvatarFallback className="bg-primary-soft font-semibold text-primary-soft-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col items-start gap-2">
        <p className="font-semibold">{t("profile.avatar")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {displayedUrl ? t("profile.changeAvatar") : t("profile.addAvatar")}
          </Button>
          {removeAvatar && imageUrl ? (
            <Button type="button" variant="ghost" onClick={() => onFileChange(null)}>
              {t("profile.restoreAvatar")}
            </Button>
          ) : (
            (imageUrl || file) && (
              <Button type="button" variant="ghost" onClick={onRemove}>
                {t("profile.removeAvatar")}
              </Button>
            )
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("profile.avatarHelp")}</p>
        {error && (
          <p role="alert" className="text-small text-destructive">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          className="sr-only"
          aria-label={t("profile.chooseAvatar")}
          onChange={selectImage}
        />
      </div>
    </div>
  );
}
