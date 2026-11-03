'use client';

import InviteButton from '@/components/ui/InviteButton';

export default function EndPageInvite() {
  return (
    <section
      id="invite"
      style={{
        background: 'linear-gradient(to bottom, #1a0808 0%, #62160E 100%)',
      }}
      className="w-full px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="invite-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h2
            id="invite-heading"
            className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl"
          >
            Want a functional community?
          </h2>
          <p className="mt-3 text-white/50">
            Invite Functious to turn your community functional with ease.
          </p>
        </div>

        <div className="flex-shrink-0">
          <InviteButton size="lg" />
        </div>
      </div>
    </section>
  );
}
