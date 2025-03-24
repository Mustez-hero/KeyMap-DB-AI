// src/components/ui/avatar.tsx
import React from "react";

// Define the props interfaces
interface AvatarProps {
  children: React.ReactNode; // The content inside the Avatar
  className?: string;        // Optional className for styling
}

interface AvatarImageProps {
  src: string;              // The image source URL
  alt: string;              // The alt text for the image
  className?: string;       // Optional className for styling
}

interface AvatarFallbackProps {
  children: React.ReactNode; // The content inside the fallback
  className?: string;        // Optional className for styling
}

// Avatar component
export function Avatar({ children, className }: AvatarProps) {
  return <div className={className}>{children}</div>;
}

// AvatarImage component
export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  return <img src={src} alt={alt} className={className} />;
}

// AvatarFallback component
export function AvatarFallback({ children, className }: AvatarFallbackProps) {
  return <div className={className}>{children}</div>;
}