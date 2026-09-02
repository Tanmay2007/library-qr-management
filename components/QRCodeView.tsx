'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
  centerText?: string;
  className?: string;
}

export function QRCodeView({
  value,
  size = 180,
  color = '#1e1b4b',
  bgColor = '#ffffff',
  centerText = '',
  className = ''
}: QRCodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: color,
          light: bgColor
        },
        errorCorrectionLevel: 'H'
      },
      (error) => {
        if (error) console.error('Error generating QR code:', error);

        if (centerText && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          const centerX = size / 2;
          const centerY = size / 2;
          const badgeSize = size * 0.22;

          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.arc(centerX, centerY, badgeSize, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.font = `bold ${Math.floor(size * 0.08)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(centerText, centerX, centerY);
        }
      }
    );
  }, [value, size, color, bgColor, centerText]);

  return (
    <div className={`inline-flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-md border border-slate-100 dark:bg-slate-900 dark:border-slate-800 ${className}`}>
      <canvas ref={canvasRef} />
      <div className="mt-2 text-center">
        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {value}
        </span>
      </div>
    </div>
  );
}
