import { notFound } from 'next/navigation';
import {
  personAddedEmail,
  noticeAddedEmail,
  shepherdAssignedEmail,
  personUpdatedEmail,
  inviteEmail,
} from '@/lib/emails/templates';

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const templates = [
    { label: 'New person added', ...personAddedEmail('John Tan', 'Long Wei') },
    {
      label: 'Notice created',
      ...noticeAddedEmail(
        'Mary Chen',
        "Mary has been struggling with anxiety and hasn't been attending Sunday service for the past 3 weeks.",
        'urgent',
        'pastor-and-shepherds',
        'Long Wei',
      ),
    },
    { label: 'Shepherd assigned', ...shepherdAssignedEmail('David Lim', 'Long Wei') },
    { label: 'Person profile updated', ...personUpdatedEmail('Sarah Wong', 'Long Wei') },
    { label: 'Invite to app', ...inviteEmail('Long Wei') },
  ];

  return (
    <div style={{ background: '#e8e8e8', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ margin: '0 0 2rem', fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>
        Email Previews
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {templates.map(({ label, subject, html }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>
                {label}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#444' }}>
                Subject: <strong>{subject}</strong>
              </span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ))}
      </div>
    </div>
  );
}
