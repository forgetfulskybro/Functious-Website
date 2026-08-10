import Link from 'next/link';
import Image from 'next/image';
import InviteButton from '@/components/ui/InviteButton';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1a0808] border-t border-orange-mid/20">
      <div className="mx-auto max-w-6xl px-6 py-12">

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded w-fit"
              aria-label="Functious home"
            >
              <Image
                src="/Functious.png"
                alt="Functious logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg flex-shrink-0"
              />
              <span className="text-orange-light font-semibold text-lg tracking-wide">
                Functious
              </span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
              A simple yet useful Fluxer companion
            </p>
            <InviteButton size="eesm" />
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              Navigate
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Home',     href: '/' },
                { label: 'Features', href: '/#features' },
                { label: 'Commands', href: '/commands' },
                { label: 'Guides',   href: '/guides' },
                { label: 'FAQ',      href: '/#faq' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-orange-light/55 hover:text-orange-warm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              External
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Support Server', href: 'https://fluxer.gg/YnINU09E' },
                { label: 'GitHub',         href: 'https://github.com/forgetfulskybro/Fluxer-Functious' },
                { label: 'Crowdin',        href: 'https://crowdin.com/project/functious' },
                { label: 'Ko-Fi',          href: 'https://ko-fi.com/forgetfulskybro' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-light/55 hover:text-orange-warm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              Legal
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'License',        href: '/license' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-orange-light/55 hover:text-orange-warm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-orange-mid/10 pt-6">
          <p className="text-center text-xs text-orange-light/30">
            &copy; {year} Functious. Released under GNU Affero General Public License v3.
          </p>
        </div>

      </div>
    </footer>
  );
}
