'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
  centerText?: string;
  className?: string;
  includeMargin?: boolean;
}

export function QRCodeView({
  value,
  size = 180,
  color = '#1e1b4b',
  bgColor = '#ffffff',
  centerText,
  className = '',
  includeMargin = true,
}: QRCodeViewProps) {
  if (!value) return null;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <QRCodeSVG
        value={value}
        size={size}
        fgColor={color}
        bgColor={bgColor}
        level="H"
        marginSize={includeMargin ? 2 : 0}
        imageSettings={
          centerText
            ? {
                src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30"><rect width="100%" height="100%" rx="8" fill="${encodeURIComponent(
                    bgColor
                  )}" stroke="${encodeURIComponent(
                    color
                  )}" stroke-width="2"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="${encodeURIComponent(
                    color
                  )}">${encodeURIComponent(centerText)}</text></svg>`,
                width: size * 0.28,
                height: size * 0.14,
                excavate: true,
              }
            : undefined
        }
        className="rounded-lg"
      />
    </div>
  );
}

