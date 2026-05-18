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
      life_stage: values.lifeStage,
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
      <div className="min-h-screen flex flex-col items-center justify-center text-center py-8 px-5 gap-4">
        <Logo height={88} />
        <div className="w-[72px] h-[72px] rounded-full bg-sage-light flex items-center justify-center">
          <CheckCircle size={36} color="var(--sage)" weight="fill" />
        </div>
        <h1 className="font-display text-24 font-bold text-text-primary">
          Thank you for visiting!
        </h1>
        <p className="text-15 text-text-secondary leading-normal max-w-[320px]">
          We've received your info. Someone from our Welcome Team will reach out to you soon. We're
          so glad you're here.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 py-3 px-5 rounded-md border border-border bg-transparent text-text-secondary text-15 font-semibold cursor-pointer"
        >
          Welcome another newcomer
        </button>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      <header className="text-center mb-6">
        <Logo height={96} style={{ margin: '0 auto 16px' }} />
        <h1 className="font-display text-24 font-bold text-text-primary mb-[6px]">
          Welcome!
        </h1>
        <p className="text-14 text-text-muted leading-comfortable">
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
        className="absolute opacity-0 left-[-9999px] w-px h-px"
      />

      <VisitorIntakeForm
        key={formKey}
        ref={formRef}
        onSubmit={handleSubmit}
        onValidityChange={setCanSubmit}
      />

      {error && (
        <p className="bg-red-light text-red py-3 px-4 rounded text-13 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={() => formRef.current?.save()}
        disabled={!canSubmit || submitting}
        className="w-full py-[0.875rem] px-5 rounded-md border-none text-16 font-semibold"
        style={{
          background: canSubmit && !submitting ? 'var(--sage)' : 'var(--border)',
          color: canSubmit && !submitting ? 'var(--on-sage)' : 'var(--text-muted)',
          cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
