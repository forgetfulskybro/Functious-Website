'use client';

import InviteButton from '@/components/ui/InviteButton';

export default function FaqSection() {

  return (
    <section
      id="faq"
      style={{
        background: 'linear-gradient(to bottom, #1a0808 0%, #62160E 100%)',
      }}
      className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
      <h2
        id="faq-heading"
        className="mb-5 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        Want a functional server?
        </h2>
        <h4 className="mb-10 text-center tracking-tight text-white/40">
          Invite Functious to turn your server functional with ease.
        </h4>
        <div className="flex justify-center">
          <InviteButton size="lg" />
        </div>
      </div>
    </section>
  );
}