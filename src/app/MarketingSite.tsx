import React, { useEffect } from 'react';
import { Blocks, Mail, ShieldCheck, Smartphone, Timer, Trophy } from 'lucide-react';

type MarketingPage = 'home' | 'privacy' | 'support';

const SITE_URL = 'https://fluxgrid-d0ad3.web.app';
const SUPPORT_EMAIL = 'support@fluxgrid.app';
const PRIVACY_EMAIL = 'privacy@fluxgrid.app';

const getMarketingPage = (): MarketingPage => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/privacy' || path === '/privacy-policy') return 'privacy';
  if (path === '/support' || path === '/contact') return 'support';
  return 'home';
};

const LegalShell: React.FC<{
  page: MarketingPage;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}> = ({ page, title, eyebrow, children }) => (
  <main className="marketing-site marketing-site--legal">
    <nav className="marketing-nav">
      <a className="marketing-brand" href="/">
        <img src="/icon-192.png" alt="" />
        <span>FluxGrid</span>
      </a>
      <div className="marketing-links">
        <a href="/privacy" aria-current={page === 'privacy' ? 'page' : undefined}>Privacy</a>
        <a href="/support" aria-current={page === 'support' ? 'page' : undefined}>Support</a>
      </div>
    </nav>

    <section className="legal-panel">
      <span className="marketing-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children}
    </section>
  </main>
);

const PrivacyPage = () => (
  <LegalShell page="privacy" eyebrow="Privacy Policy" title="FluxGrid Privacy Policy">
    <p>
      FluxGrid is a mobile puzzle game. We use limited data to run the game, remember progress,
      improve stability, show ads, and support optional notifications.
    </p>
    <h2>Data We May Use</h2>
    <ul>
      <li>Local gameplay progress, settings, scores, and tutorial state.</li>
      <li>Anonymous diagnostics such as crashes, performance issues, and device capability signals.</li>
      <li>Advertising identifiers or ad related signals when ads are available in the app.</li>
      <li>Notification permission and device token only when notification features are enabled.</li>
    </ul>
    <h2>Third Party Services</h2>
    <p>
      The app may use Firebase, Google Play services, Google AdMob, and crash reporting tools.
      These services process data according to their own privacy policies.
    </p>
    <h2>Contact</h2>
    <p>
      For privacy questions, contact <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
    </p>
    <p className="legal-note">Last updated: June 7, 2026</p>
  </LegalShell>
);

const SupportPage = () => (
  <LegalShell page="support" eyebrow="Support" title="FluxGrid Support">
    <p>
      Need help with FluxGrid, ads, notifications, performance, or game progress? Send a short
      message with your device model and app version.
    </p>
    <div className="support-actions">
      <a className="marketing-button marketing-button--primary" href={`mailto:${SUPPORT_EMAIL}`}>
        <Mail size={18} />
        Email Support
      </a>
      <a className="marketing-button marketing-button--ghost" href={SITE_URL}>
        Visit Website
      </a>
    </div>
    <h2>Useful Details To Include</h2>
    <ul>
      <li>Phone model and Android version.</li>
      <li>What happened before the issue.</li>
      <li>A screenshot if it is a visual problem.</li>
    </ul>
  </LegalShell>
);

const HomePage = () => (
  <main className="marketing-site">
    <nav className="marketing-nav">
      <a className="marketing-brand" href="/">
        <img src="/icon-192.png" alt="" />
        <span>FluxGrid</span>
      </a>
      <div className="marketing-links">
        <a href="/privacy">Privacy</a>
        <a href="/support">Support</a>
      </div>
    </nav>

    <section className="marketing-hero">
      <div className="marketing-copy">
        <span className="marketing-eyebrow">3D Block Puzzle</span>
        <h1>FluxGrid - 3D Block Puzzle</h1>
        <p>
          A mobile-first block puzzle with a clean 3D board, readable clears, timed runs, and
          one-more-try pacing built for Android.
        </p>
        <div className="marketing-actions">
          <button className="marketing-button marketing-button--primary" type="button" disabled>
            <Smartphone size={18} />
            Coming to Google Play
          </button>
          <a className="marketing-button marketing-button--ghost" href="/privacy">
            <ShieldCheck size={18} />
            Privacy Policy
          </a>
        </div>
        <div className="marketing-store-notes" aria-label="Launch status">
          <span>Android focused</span>
          <span>Free to play</span>
          <span>Timed mode</span>
        </div>
      </div>

      <div className="marketing-showcase" aria-label="FluxGrid app icon preview">
        <div className="marketing-app-preview">
          <img src="/icon-hero.png" alt="FluxGrid voxel block icon" />
        </div>
      </div>
    </section>

    <section className="feature-band" aria-label="Game features">
      <article>
        <Blocks size={22} />
        <h2>3D Board</h2>
        <p>Place pieces on a readable 3D grid with clear depth, contrast, and touch feedback.</p>
      </article>
      <article>
        <Timer size={22} />
        <h2>Timed Runs</h2>
        <p>Earn seconds, protect your streak, and chase a cleaner 60-second run.</p>
      </article>
      <article>
        <Trophy size={22} />
        <h2>Combos</h2>
        <p>Build smart clears with focused effects, haptics, and readable score moments.</p>
      </article>
    </section>
  </main>
);

export const MarketingSite: React.FC = () => {
  const page = getMarketingPage();

  useEffect(() => {
    document.body.classList.add('marketing-page');
    return () => document.body.classList.remove('marketing-page');
  }, []);

  useEffect(() => {
    const titles: Record<MarketingPage, string> = {
      home: 'FluxGrid - 3D Block Puzzle',
      privacy: 'Privacy Policy - FluxGrid',
      support: 'Support - FluxGrid',
    };
    document.title = titles[page];
  }, [page]);

  if (page === 'privacy') return <PrivacyPage />;
  if (page === 'support') return <SupportPage />;
  return <HomePage />;
};
