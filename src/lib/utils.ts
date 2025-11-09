import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateRefCode = (seed?: number) => {
  if (typeof seed === 'number') {
    const normalized = Math.abs(seed) % 100000;
    return `nop${normalized.toString().padStart(5, '0')}`;
  }
  const random = Math.floor(10000 + Math.random() * 90000);
  return `nop${random}`;
};
