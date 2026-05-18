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
        className="relative w-18 h-18 rounded-full p-0 border-none bg-transparent cursor-pointer shrink-0"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="w-18 h-18 rounded-full object-cover block"
          />
        ) : (
          <div
            className="w-18 h-18 rounded-full bg-sage-light flex items-center justify-center text-22 font-bold text-sage"
            style={{ border: '0.125rem dashed var(--sage)' }}
          >
            {placeholder ?? initials}
          </div>
        )}
        <div
          className="absolute bottom-0 right-0 w-[1.375rem] h-[1.375rem] rounded-full bg-sage flex items-center justify-center"
          style={{ border: '0.125rem solid var(--bg)' }}
        >
          <Camera size={11} color="var(--on-sage)" weight="fill" />
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {showPreview &&
        photo &&
        createPortal(
          <div
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', zIndex: Z_FLOAT }}
            onClick={() => !uploading && setShowPreview(false)}
          >
            <button
              onClick={() => !uploading && setShowPreview(false)}
              className="absolute top-5 right-5 border-none rounded-full w-9 h-9 flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.15)',
                cursor: uploading ? 'default' : 'pointer',
                opacity: uploading ? 0.4 : 1,
              }}
            >
              <X size={20} color="#fff" weight="bold" />
            </button>

            {uploading ? (
              <SpinnerGap
                size={48}
                color="#fff"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={name}
                  className="max-w-[90vw] max-h-[65vh] rounded-md object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="flex gap-3 mt-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleEditPhoto}
                    className="flex items-center gap-2 border-none rounded-[2rem] py-[0.625rem] px-5 cursor-pointer text-15 font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                    }}
                  >
                    <PencilSimple size={16} color="#fff" weight="bold" />
                    Edit photo
                  </button>
                  <button
                    onClick={handleRemove}
                    className="flex items-center gap-2 border-none rounded-[2rem] py-[0.625rem] px-5 cursor-pointer text-15 font-medium"
                    style={{
                      background: 'rgba(220,53,69,0.25)',
                      color: '#ff6b6b',
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
