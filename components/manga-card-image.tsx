"use client";

import Image from "next/image";
import { useState } from "react";

interface MangaCardImageProps {
  src: string;
  alt: string;
  title?: string; // Optional title, though placeholder will be generic
}

export function MangaCardImage({ src, alt, title }: MangaCardImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
        {"Image not available"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      style={{ objectFit: "cover" }}
      className="rounded"
      onError={() => {
        setHasError(true);
      }}
    />
  );
} 