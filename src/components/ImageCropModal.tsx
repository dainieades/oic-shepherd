'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from '@phosphor-icons/react';

interface Props {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const CROP_DIAMETER = 280;
const OUTPUT_SIZE = 400;
const MAX_SCALE = 8;

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
  const [minScale, setMinScale] = React.useState(0.01);
  const [naturalSize, setNaturalSize] = React.useState({ w: 0, h: 0 });

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    startOX: number;
    startOY: number;
  } | null>(null);
  const pinchRef = React.useRef<{ initialDist: number; initialScale: number } | null>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      setNaturalSize({ w, h });
      const fitScale = CROP_DIAMETER / Math.min(w, h);
      setMinScale(fitScale);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOX: offset.x,
      startOY: offset.y,
    };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.startOX + e.clientX - dragRef.current.startX,
      y: dragRef.current.startOY + e.clientY - dragRef.current.startY,
    });
  };
  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startOX: offset.x,
        startOY: offset.y,
      };
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        initialDist: Math.sqrt(dx * dx + dy * dy),
        initialScale: scale,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      setOffset({
        x: dragRef.current.startOX + e.touches[0].clientX - dragRef.current.startX,
        y: dragRef.current.startOY + e.touches[0].clientY - dragRef.current.startY,
      });
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setScale(
        Math.max(
          minScale,
          Math.min(MAX_SCALE, pinchRef.current.initialScale * (dist / pinchRef.current.initialDist))
        )
      );
    }
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };
  const handleTouchCancel = handleTouchEnd;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const clamped = Math.max(-30, Math.min(30, e.deltaY));
    setScale((s) => Math.max(minScale, Math.min(MAX_SCALE, s * (1 - clamped * 0.01))));
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !naturalSize.w) return;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const cropRadius = CROP_DIAMETER / 2;
    const cropCenterX = naturalSize.w / 2 - offset.x / scale;
    const cropCenterY = naturalSize.h / 2 - offset.y / scale;
    const cropRadius_img = cropRadius / scale;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(
        img,
        cropCenterX - cropRadius_img,
        cropCenterY - cropRadius_img,
        cropRadius_img * 2,
        cropRadius_img * 2,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );
      canvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob);
        },
        'image/jpeg',
        0.9
      );
    };
    img.src = imageSrc;
  };

  const scaledW = naturalSize.w * scale;
  const scaledH = naturalSize.h * scale;

  return createPortal(
    <div
      className="fixed inset-0 bg-[#111] flex flex-col touch-none z-float"
    >
      <div className="flex items-center justify-between py-[0.875rem] px-5 text-white shrink-0">
        <button
          onClick={onCancel}
          className="bg-transparent border-none text-white p-2 cursor-pointer leading-none"
          aria-label="Cancel"
        >
          <X size={24} />
        </button>
        <span className="text-16 font-semibold tracking-tight-1">
          Move and Scale
        </span>
        <button
          onClick={handleConfirm}
          className="bg-transparent border-none text-white p-2 cursor-pointer leading-none"
          aria-label="Confirm crop"
        >
          <Check size={24} weight="bold" />
        </button>
      </div>

      <div
        className="flex-1 relative overflow-hidden cursor-grab touch-none select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onWheel={handleWheel}
      >
        {naturalSize.w > 0 && (
          <div
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{
              width: scaledW,
              height: scaledH,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="w-full h-full block"
            />
          </div>
        )}

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <mask id="imagecrop-overlay-mask">
              <rect width="100%" height="100%" fill="white" />
              <circle cx="50%" cy="50%" r={CROP_DIAMETER / 2} fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#imagecrop-overlay-mask)"
          />
          <circle
            cx="50%"
            cy="50%"
            r={CROP_DIAMETER / 2}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="pt-4 px-7 pb-6 shrink-0 flex flex-col items-center gap-2.5">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(
            ((Math.log(scale) - Math.log(minScale)) / (Math.log(MAX_SCALE) - Math.log(minScale))) *
              100
          )}
          onChange={(e) => {
            const t = Number(e.target.value) / 100;
            setScale(Math.exp(Math.log(minScale) + t * (Math.log(MAX_SCALE) - Math.log(minScale))));
          }}
          className="w-full cursor-pointer"
          style={{ accentColor: '#fff' }}
          aria-label="Zoom"
        />
        <span className="text-11 text-[rgba(255,255,255,0.4)]">
          Drag to reposition · Pinch or scroll to zoom
        </span>
      </div>
    </div>,
    document.body
  );
}
