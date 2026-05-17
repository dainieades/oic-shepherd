'use client';

import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';
import { Logo } from '@/components/Logo';
import VisitorIntakeForm, {
  type VisitorIntakeFormHandle,
  type VisitorIntakeValues,
} from '@/components/VisitorIntakeForm';

export default function WelcomePage() {
  const formRef = React.useRef<VisitorIntakeFormHandle>(null);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [honeypot, setHoneypot] = React.useState('');
  const [formKey, setFormKey] = React.useState(0);

  const handleReset = () => {
    setDone(false);
    setError(null);
    setHoneypot('');
    setCanSubmit(false);
    setFormKey((k) => k + 1);
  };

  const handleSubmit = async (values: VisitorIntakeValues) => {
    if (honeypot.trim().length > 0) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from('visitor_submissions').insert({
      source: 'qr',
      status: 'pending',
      person_id: null,
      submitted_by: null,
      preferred_name: values.preferredName,
      last_name: values.lastName ?? null,
      alternative_name: values.alternativeName ?? null,
      phone: values.phone ?? null,
      email: values.email ?? null,
      is_student: values.isStudent,
      languages: values.languages,
      referral_source: values.referralSource ?? null,
      referral_detail: values.referralDetail ?? null,
      interests: values.interests,
      prayer_request: values.prayerRequest ?? null,
    });
    setSubmitting(false);
    if (insertError) {
      setError(
        "Sorry, we couldn't submit your card. Please try again or talk to a Welcome Team member."
      );
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem 1.25rem',
          gap: 16,
        }}
      >
        <Logo height={88} />
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle size={36} color="var(--sage)" weight="fill" />
        </div>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--text-24)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}
        >
          Thank you for visiting!
        </h1>
        <p style={{ fontSize: 'var(--text-15)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', maxWidth: 320 }}>
          We've received your info. Someone from our Welcome Team will reach out to you soon. We're
          so glad you're here.
        </p>
        <button
          type="button"
          onClick={handleReset}
          style={{
            marginTop: 8,
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-15)',
            fontWeight: 'var(--font-semibold)',
            cursor: 'pointer',
          }}
        >
          Welcome another newcomer
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 48 }}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <Logo height={96} style={{ margin: '0 auto 16px' }} />
        <h1
          className="font-display"
          style={{ fontSize: 'var(--text-24)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 6 }}
        >
          Welcome!
        </h1>
        <p style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)', lineHeight: 'var(--leading-comfortable)' }}>
          We'd love to get to know you. Fill out this card so we can stay in touch.
        </p>
      </header>

      <input
        type="text"
        name="company"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <VisitorIntakeForm
        key={formKey}
        ref={formRef}
        onSubmit={handleSubmit}
        onValidityChange={setCanSubmit}
      />

      {error && (
        <p
          style={{
            background: 'var(--red-light, #fee2e2)',
            color: 'var(--red, #b91c1c)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            fontSize: 'var(--text-13)',
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={() => formRef.current?.save()}
        disabled={!canSubmit || submitting}
        style={{
          width: '100%',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: canSubmit && !submitting ? 'var(--sage)' : 'var(--border)',
          color: canSubmit && !submitting ? 'var(--on-sage)' : 'var(--text-muted)',
          fontSize: 'var(--text-16)',
          fontWeight: 'var(--font-semibold)',
          cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
