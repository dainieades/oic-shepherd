'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, Trash, PencilSimple, X, SpinnerGap } from '@phosphor-icons/react';
import ImageCropModal from './ImageCropModal';
import { Z_FLOAT } from '@/lib/constants';
import { uploadPhoto, deletePhotos, resizeImageBlob } from '@/utils/supabase/storage';

interface Props {
  photo?: string;
  originalPhoto?: string;
  name: string;
  entityPath?: string; // e.g. 'people/abc123' — if omitted, falls back to data URL
  placeholder?: React.ReactNode;
  onPhotoChange: (photoUrl: string, originalUrl: string) => void;
  onPhotoRemove: () => void;
}

export default function PhotoAvatar({
  photo,
  originalPhoto,
  name,
  entityPath,
  placeholder,
  onPhotoChange,
  onPhotoRemove,
}: Props) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [originalSrc, setOriginalSrc] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
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
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setOriginalSrc(dataUrl);
      setCropSrc(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhoto = () => {
    // Prefer session-local original (full res), then stored original, then current photo
    setCropSrc(originalSrc ?? originalPhoto ?? photo!);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    if (!entityPath) {
      // No storage path — fall back to data URL (add-person flow)
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        onPhotoChange(url, url);
      };
      reader.readAsDataURL(blob);
      setOriginalSrc(null);
      setShowPreview(false);
      return;
    }

    setUploading(true);
    try {
      const [photoUrl, origUrl] = await Promise.all([
        uploadPhoto(`${entityPath}/photo.jpg`, blob),
        // Only upload original if we don't already have one stored
        !originalPhoto && originalSrc
          ? fetch(originalSrc)
              .then((r) => r.blob())
              .then((b) => resizeImageBlob(b, 1500))
              .then((b) => uploadPhoto(`${entityPath}/original.jpg`, b))
          : Promise.resolve(originalPhoto ?? null),
      ]);
      onPhotoChange(photoUrl, origUrl ?? photoUrl);
    } finally {
      setUploading(false);
      setOriginalSrc(null);
      setShowPreview(false);
    }
  };

  const handleRemove = async () => {
    if (entityPath) {
      await deletePhotos([`${entityPath}/photo.jpg`, `${entityPath}/original.jpg`]);
    }
    setOriginalSrc(null);
    setShowPreview(false);
    onPhotoRemove();
  };

  return (
    <>
      <button
        onClick={() => (photo ? setShowPreview(true) : fileInputRef.current?.click())}
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
            {placeholder ?? initials}
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
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {showPreview && photo &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              zIndex: Z_FLOAT,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => !uploading && setShowPreview(false)}
          >
            <button
              onClick={() => !uploading && setShowPreview(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
                opacity: uploading ? 0.4 : 1,
              }}
            >
              <X size={20} color="#fff" weight="bold" />
            </button>

            {uploading ? (
              <SpinnerGap size={48} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={name}
                  style={{ maxWidth: '90vw', maxHeight: '65vh', borderRadius: '0.75rem', objectFit: 'contain' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleEditPhoto}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(255,255,255,0.15)', border: 'none',
                      borderRadius: '2rem', padding: '0.625rem 1.25rem',
                      cursor: 'pointer', color: '#fff', fontSize: '0.9375rem', fontWeight: 500,
                    }}
                  >
                    <PencilSimple size={16} color="#fff" weight="bold" />
                    Edit photo
                  </button>
                  <button
                    onClick={handleRemove}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(220,53,69,0.25)', border: 'none',
                      borderRadius: '2rem', padding: '0.625rem 1.25rem',
                      cursor: 'pointer', color: '#ff6b6b', fontSize: '0.9375rem', fontWeight: 500,
                    }}
                  >
                    <Trash size={16} color="#ff6b6b" weight="bold" />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body
        )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
