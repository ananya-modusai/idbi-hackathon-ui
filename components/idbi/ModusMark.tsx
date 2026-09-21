"use client";

// The modus mark — navy "m" cropped from the wordmark, used wherever the agent needs a face.
// Ported from axis-cam-ui/app/pages/ModusAgent/ModusMark.tsx.

import Image from "next/image";
import { cn } from "@/lib/utils";

export function ModusMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/modus-mark.png"
      alt="Modus"
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className={cn("shrink-0 select-none", className)}
      priority
    />
  );
}

export default ModusMark;
