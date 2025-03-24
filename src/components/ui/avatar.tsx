// src/components/ui/avatar.tsx
import React from "react";
import Image from "next/image";

// Define the props interfaces
interface AvatarProps {
  children: React.ReactNode; // The content inside the Avatar
  className?: string;        // Optional className for styling
}

interface AvatarImageProps {
  src: string;              // The image source URL
  alt: string;              // The alt text for the image
  className?: string;       // Optional className for styling
  width?: number;           // Optional width for the image
  height?: number;          // Optional height for the image
}

interface AvatarFallbackProps {
  children: React.ReactNode; // The content inside the fallback
  className?: string;        // Optional className for styling
}

// Avatar component
export function Avatar({ children, className }: AvatarProps) {
  return <div className={`relative flex items-center justify-center ${className}`}>{children}</div>;
}

// AvatarImage component
export function AvatarImage({ src, alt, className, width = 40, height = 40 }: AvatarImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      className={`rounded-full ${className}`}
      width={width}
      height={height}
      priority
    />
  );
}

// AvatarFallback component
export function AvatarFallback({ children, className }: AvatarFallbackProps) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-gray-300 text-white ${className}`}>
      {children}
    </div>
  );
}
