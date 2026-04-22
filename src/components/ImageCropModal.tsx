'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from '@phosphor-icons/react';
import { Z_FLOAT } from '@/lib/constants';

interface Props {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const CROP_DIAMETER = 280;
const OUTPUT_SIZE = 400;
const MIN_SCALE = 0.3;
const MAX_SCALE = 8;

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
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
      const minDim = Math.min(w, h);
      setScale(CROP_DIAMETER / minDim);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOX: offset.x, startOY: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.startOX + e.clientX - dragRef.current.startX,
      y: dragRef.current.startOY + e.clientY - dragRef.current.startY,
    });
  };
  const handleMouseUp = () => { dragRef.current = null; };

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
        Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.initialScale * (dist / pinchRef.current.initialDist)))
      );
    }
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const clamped = Math.max(-30, Math.min(30, e.deltaY));
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * (1 - clamped * 0.01))));
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
      onConfirm(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  };

  const scaledW = naturalSize.w * scale;
  const scaledH = naturalSize.h * scale;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_FLOAT,
        background: '#111',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#fff', padding: 8, cursor: 'pointer', lineHeight: 0 }}
          aria-label="Cancel"
        >
          <X size={24} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Move and Scale</span>
        <button
          onClick={handleConfirm}
          style={{ background: 'none', border: 'none', color: '#fff', padding: 8, cursor: 'pointer', lineHeight: 0 }}
          aria-label="Confirm crop"
        >
          <Check size={24} weight="bold" />
        </button>
      </div>

      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {naturalSize.w > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: scaledW,
              height: scaledH,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              pointerEvents: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        )}

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            <mask id="imagecrop-overlay-mask">
              <rect width="100%" height="100%" fill="white" />
              <circle cx="50%" cy="50%" r={CROP_DIAMETER / 2} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#imagecrop-overlay-mask)" />
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

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div
        style={{
          padding: '16px 28px 24px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(
            ((Math.log(scale) - Math.log(MIN_SCALE)) / (Math.log(MAX_SCALE) - Math.log(MIN_SCALE))) * 100
          )}
          onChange={(e) => {
            const t = Number(e.target.value) / 100;
            setScale(Math.exp(Math.log(MIN_SCALE) + t * (Math.log(MAX_SCALE) - Math.log(MIN_SCALE))));
          }}
          style={{ width: '100%', accentColor: '#fff', cursor: 'pointer' }}
          aria-label="Zoom"
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          Drag to reposition · Pinch or scroll to zoom
        </span>
      </div>
    </div>,
    document.body
  );
}
