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
        className="relative h-18 w-18 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="block h-18 w-18 rounded-full object-cover" />
        ) : (
          <div
            className="bg-sage-light text-22 text-sage flex h-18 w-18 items-center justify-center rounded-full font-bold"
            style={{ border: '0.125rem dashed var(--sage)' }}
          >
            {placeholder ?? initials}
          </div>
        )}
        <div
          className="bg-sage absolute right-0 bottom-0 flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full"
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
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border-none"
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
                  className="max-h-[65vh] max-w-[90vw] rounded-md object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="mt-6 flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleEditPhoto}
                    className="text-15 flex cursor-pointer items-center gap-2 rounded-[2rem] border-none px-5 py-[0.625rem] font-medium"
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
                    className="text-15 flex cursor-pointer items-center gap-2 rounded-[2rem] border-none px-5 py-[0.625rem] font-medium"
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
