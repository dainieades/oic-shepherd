'use client';

import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { Logo } from '@/components/Logo';
import VisitorIntakeForm, { type VisitorIntakeFormHandle } from '@/components/VisitorIntakeForm';
import type { VisitorIntakeValues } from '@/lib/types';
import { useApp } from '@/lib/context';

export default function WelcomePage() {
  const { submitVisitorCard } = useApp();
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
    try {
      await submitVisitorCard(values);
      setDone(true);
    } catch {
      setError(
        "Sorry, we couldn't submit your card. Please try again or talk to a Welcome Team member."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 py-8 text-center">
        <Logo height={88} />
        <div className="bg-sage-light flex h-[72px] w-[72px] items-center justify-center rounded-full">
          <CheckCircle size={36} color="var(--sage)" weight="fill" />
        </div>
        <h1 className="font-display text-24 text-text-primary font-bold">
          Thank you for visiting!
        </h1>
        <p className="text-15 text-text-secondary max-w-[320px] leading-normal">
          We've received your info. Someone from our Welcome Team will reach out to you soon. We're
          so glad you're here.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="border-border text-text-secondary text-15 mt-2 cursor-pointer rounded-md border bg-transparent px-5 py-3 font-semibold"
        >
          Welcome another newcomer
        </button>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      <header className="mb-6 text-center">
        <Logo height={96} style={{ margin: '0 auto var(--spacing-lg)' }} />
        <h1 className="font-display text-24 text-text-primary mb-[6px] font-bold">Welcome!</h1>
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
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      <VisitorIntakeForm
        key={formKey}
        ref={formRef}
        onSubmit={handleSubmit}
        onValidityChange={setCanSubmit}
      />

      {error && <p className="bg-red-light text-red text-13 mb-4 rounded px-4 py-3">{error}</p>}

      <button
        onClick={() => formRef.current?.save()}
        disabled={!canSubmit || submitting}
        className="text-16 bg-sage text-on-sage disabled:bg-border disabled:text-text-muted w-full cursor-pointer rounded-md border-none px-5 py-[0.875rem] font-semibold disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
