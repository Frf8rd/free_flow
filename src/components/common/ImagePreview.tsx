import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function ImagePreview({ src, alt, className, imageClassName }: ImagePreviewProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`${t("upload.enlargeImage")}: ${alt}`}
        className={cn(
          "group block cursor-zoom-in overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={cn("transition-transform group-hover:scale-105", imageClassName)}
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid w-[calc(100%-2rem)] max-w-5xl place-items-center border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt}           className="max-h-[85vh] w-full max-w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
