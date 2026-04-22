'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, Trash } from '@phosphor-icons/react';
import ImageCropModal from './ImageCropModal';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS, Z_NESTED } from '@/lib/constants';

interface Props {
  photo?: string;
  name: string;
  onPhotoChange: (dataUrl: string) => void;
  onPhotoRemove: () => void;
}

export default function PhotoAvatar({ photo, name, onPhotoChange, onPhotoRemove }: Props) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={() => (photo ? setShowMenu(true) : fileInputRef.current?.click())}
        style={{
          position: 'relative',
          width: 72,
          height: 72,
          borderRadius: '50%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--sage-light)',
              border: '0.125rem dashed var(--sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--sage)',
            }}
          >
            {initials}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--sage)',
            border: '0.125rem solid var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={11} color="var(--on-sage)" weight="fill" />
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={(croppedUrl) => {
            onPhotoChange(croppedUrl);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {showMenu &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: BACKDROP_COLOR,
              zIndex: Z_NESTED,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
            onClick={() => setShowMenu(false)}
          >
            <div
              className="animate-slide-up"
              style={{
                background: 'var(--surface)',
                borderRadius: SHEET_BORDER_RADIUS,
                width: '100%',
                maxWidth: SHEET_MAX_WIDTH,
                padding: '0 1.25rem 2.25rem',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 2,
                  margin: '0.875rem auto 1.25rem',
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Profile Photo
              </p>
              <button
                onClick={() => {
                  setShowMenu(false);
                  fileInputRef.current?.click();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '0.875rem 0.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: photo ? '1px solid var(--border-light)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--sage-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Camera size={18} color="var(--sage)" />
                </div>
                <span style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {photo ? 'Replace photo' : 'Upload photo'}
                </span>
              </button>
              {photo && (
                <button
                  onClick={() => {
                    onPhotoRemove();
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '0.875rem 0.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--red-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash size={18} color="var(--red)" />
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--red)', fontWeight: 500 }}>
                    Remove photo
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
