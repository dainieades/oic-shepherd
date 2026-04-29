import { notFound } from 'next/navigation';
import { EMAIL_PREVIEW_REGISTRY } from '@/lib/emails/templates';
import EmailPreviewClient from './EmailPreviewClient';

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return <EmailPreviewClient emails={EMAIL_PREVIEW_REGISTRY} />;
}
