import React, { useEffect } from 'react';
import {
  ArrowRight,
  Blocks,
  Bomb,
  Gauge,
  Layers3,
  Mail,
  Snowflake,
  Sparkles,
  Smartphone,
  Timer,
  Trophy,
} from 'lucide-react';

type MarketingPage = 'home' | 'privacy' | 'support';

const SITE_URL = 'https://fluxgrid-d0ad3.web.app';
const SUPPORT_EMAIL = 'support@fluxgrid.app';
const PRIVACY_EMAIL = 'privacy@fluxgrid.app';

const BOARD_CELLS: Record<number, string> = {
  4: 'cyan', 5: 'cyan', 14: 'cyan', 15: 'cyan',
  20: 'violet', 21: 'violet', 22: 'violet', 30: 'violet',
  37: 'ice', 38: 'blue', 39: 'blue', 47: 'blue', 48: 'blue', 49: 'blue',
  53: 'amber', 54: 'amber', 55: 'bomb', 63: 'amber', 64: 'amber', 65: 'amber',
  70: 'green', 71: 'green', 72: 'green', 73: 'green', 74: 'green', 75: 'green',
  80: 'green', 81: 'green', 82: 'green', 83: 'green', 84: 'green', 85: 'green',
  90: 'rose', 91: 'rose', 92: 'rose', 93: 'rose', 94: 'rose', 95: 'rose', 96: 'rose',
};

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
      FluxGrid is a mobile puzzle game published by PisaGaming. This policy explains how data is
      handled when you use the Android app.
    </p>
    <h2>Data stored on your device</h2>
    <ul>
      <li>Gameplay progress, scores, statistics, achievements, tutorial state, and settings.</li>
      <li>Ad consent choices and notification preferences.</li>
    </ul>
    <h2>Data processed by online services</h2>
    <ul>
      <li>AdMob may process IP-based approximate location, advertising or device identifiers, ad interactions, and diagnostics to deliver ads, measure them, and prevent fraud.</li>
      <li>Firebase Analytics and Performance may process app interactions, session information, device/app details, and performance diagnostics.</li>
      <li>Firebase Crashlytics may process crash logs, stack traces, app state, device details, and an installation identifier to diagnose failures.</li>
      <li>Optional reminders are scheduled on your device. FluxGrid does not upload a notification token for these reminders.</li>
    </ul>
    <p>FluxGrid does not request GPS, contacts, camera, microphone, payment, health, or message data.</p>
    <h2>Purposes and sharing</h2>
    <p>
      Data is used to operate and improve the app, diagnose crashes, measure usage, deliver optional
      notifications, show ads, and prevent fraud. It may be processed by Google services including
      Firebase, Google Play services, and Google AdMob under their own privacy terms. We do not sell
      personal data.
    </p>
    <h2>Control, retention, and deletion</h2>
    <p>
      Local data can be deleted with Reset Data in Settings or by uninstalling the app. Ad privacy
      choices can be reviewed from Settings where required. Online service providers retain data
      according to their configured retention periods and legal obligations. To request deletion of
       ask about privacy, contact us.
    </p>
    <h2>Children and international processing</h2>
    <p>
      FluxGrid is not directed to children under 13 and we do not knowingly collect personal data
      from them. Service providers may process data in countries outside your own using applicable
      legal safeguards.
    </p>
    <h2>Contact and changes</h2>
    <p>
      For privacy questions, contact <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      Material changes will be published on this page with a new update date.
    </p>
    <p className="legal-note">Last updated: July 16, 2026</p>

    <hr />
    <h2>Türkçe özet</h2>
    <p>
      FluxGrid; oyun ilerlemesini, skorları ve ayarları cihazda saklar. AdMob reklam sunumu ve
      ölçümü için yaklaşık konum, cihaz/reklam kimliği, etkileşim ve tanılama verileri işleyebilir.
      Firebase kullanım, performans ve çökme verilerini işler. Bildirimleri açarsanız hatırlatmalar
      cihazınızda planlanır; bu amaçla bir FCM token'ı sunucuya yüklenmez.
    </p>
    <p>
      Yerel verileri Ayarlar içindeki Verileri Sıfırla seçeneğiyle veya uygulamayı kaldırarak
      silebilirsiniz. Gizlilik talepleri için
      {' '}<a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> adresine yazın. FluxGrid 13 yaş
      altındaki çocuklara yönelik değildir.
    </p>
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

const GamePreview = () => (
  <div className="marketing-game-card" aria-hidden="true">
    <div className="marketing-game-card__topline">
      <div>
        <span>Score</span>
        <strong>12,480</strong>
      </div>
      <div className="marketing-combo-chip">x3 combo</div>
    </div>

    <div className="marketing-tier">
      <div className="marketing-tier__labels">
        <span>Tier 3</span>
        <strong>1,520 left</strong>
      </div>
      <div className="marketing-tier__track"><span /></div>
    </div>

    <div className="marketing-demo-board">
      {Array.from({ length: 100 }, (_, index) => {
        const cell = BOARD_CELLS[index];
        return (
          <span key={index} className={cell ? `marketing-demo-cell is-${cell}` : 'marketing-demo-cell'}>
            {cell === 'ice' && <Snowflake size={10} />}
            {cell === 'bomb' && <Bomb size={11} />}
          </span>
        );
      })}
      <div className="marketing-clear-label">Gravity chain <b>+480</b></div>
    </div>

    <div className="marketing-piece-tray">
      <div className="marketing-piece marketing-piece--corner"><i /><i /><i /></div>
      <div className="marketing-piece marketing-piece--line"><i /><i /><i /><i /></div>
      <div className="marketing-piece marketing-piece--square"><i /><i /><i /><i /></div>
    </div>
  </div>
);

const HomePage = () => (
  <main className="marketing-site">
    <nav className="marketing-nav">
      <a className="marketing-brand" href="/">
        <img src="/icon-192.png" alt="" />
        <span>FluxGrid</span>
      </a>
      <div className="marketing-links marketing-links--home">
        <a href="#gameplay">How it plays</a>
        <a href="#features">Features</a>
        <a href="/privacy">Privacy</a>
        <a href="/support">Support</a>
      </div>
    </nav>

    <section className="marketing-hero">
      <div className="marketing-copy">
        <span className="marketing-eyebrow">A block puzzle that keeps moving</span>
        <h1>Clear the grid. <em>Shift the board.</em> Build the chain.</h1>
        <p>
          FluxGrid is a mobile 2D block puzzle where every clear can trigger gravity, reshape
          your next move, and turn a simple line into a bigger combo.
        </p>
        <div className="marketing-actions">
          <a className="marketing-button marketing-button--primary" href="#gameplay">
            See how it plays
            <ArrowRight size={18} />
          </a>
          <span className="marketing-release-note">
            <Smartphone size={17} />
            Google Play release in progress
          </span>
        </div>
        <div className="marketing-store-notes" aria-label="Game highlights">
          <span>10 x 10 strategy</span>
          <span>Gravity clears</span>
          <span>Special blocks</span>
        </div>
      </div>

      <div className="marketing-showcase" aria-label="FluxGrid gameplay preview">
        <GamePreview />
      </div>
    </section>

    <section className="marketing-flow" id="gameplay">
      <div className="marketing-section-heading">
        <span className="marketing-eyebrow">The core loop</span>
        <h2>One clear changes what comes next.</h2>
        <p>The board does not stay frozen after a move. Cleared lines create new openings and new risks.</p>
      </div>
      <div className="marketing-flow__steps">
        <article><b>01</b><h3>Place</h3><p>Fit one of three pieces onto the 10 x 10 board.</p></article>
        <article><b>02</b><h3>Clear</h3><p>Complete rows or columns to open the grid.</p></article>
        <article><b>03</b><h3>Collapse</h3><p>Gravity pulls blocks down and reshapes the board.</p></article>
        <article><b>04</b><h3>Chain</h3><p>Use the new layout to extend combos and score.</p></article>
      </div>
    </section>

    <section className="marketing-features" id="features">
      <div className="marketing-section-heading">
        <span className="marketing-eyebrow">More than line clears</span>
        <h2>Built for readable, fast mobile play.</h2>
      </div>
      <div className="marketing-feature-grid">
        <article className="marketing-feature-card marketing-feature-card--wide">
          <Layers3 size={24} />
          <h3>Gravity changes the board</h3>
          <p>Cleared spaces pull blocks downward, so every move can create a second tactical opportunity.</p>
        </article>
        <article className="marketing-feature-card">
          <Snowflake size={24} />
          <h3>Special blocks</h3>
          <p>Break ICE, trigger bombs, and adapt when locked cells interrupt the cleanest route.</p>
        </article>
        <article className="marketing-feature-card">
          <Trophy size={24} />
          <h3>Endless tiers</h3>
          <p>Progress through changing objectives without losing sight of the current board.</p>
        </article>
        <article className="marketing-feature-card">
          <Timer size={24} />
          <h3>Timed runs</h3>
          <p>Make quick, deliberate moves and push a focused 60-second score attempt.</p>
        </article>
        <article className="marketing-feature-card marketing-feature-card--wide">
          <Sparkles size={24} />
          <h3>Feedback where it matters</h3>
          <p>Compact clear effects, score collection, sound, and haptics reinforce the move without covering the board.</p>
        </article>
        <article className="marketing-feature-card">
          <Gauge size={24} />
          <h3>Designed for mobile</h3>
          <p>A native 2D canvas, event-driven rendering, and an interface tuned for portrait play.</p>
        </article>
      </div>
    </section>

    <section className="marketing-final-cta">
      <img src="/icon-192.png" alt="" />
      <div>
        <span className="marketing-eyebrow">FluxGrid for Android</span>
        <h2>Your next clear should change the board.</h2>
      </div>
      <a className="marketing-button marketing-button--ghost" href="/support">
        <Mail size={18} />
        Contact support
      </a>
    </section>

    <footer className="marketing-footer">
      <a className="marketing-brand" href="/"><Blocks size={24} /><span>FluxGrid</span></a>
      <p>2D gravity block puzzle for Android.</p>
      <div><a href="/privacy">Privacy</a><a href="/support">Support</a></div>
    </footer>
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
      home: 'FluxGrid - 2D Gravity Block Puzzle',
      privacy: 'Privacy Policy - FluxGrid',
      support: 'Support - FluxGrid',
    };
    document.title = titles[page];
  }, [page]);

  if (page === 'privacy') return <PrivacyPage />;
  if (page === 'support') return <SupportPage />;
  return <HomePage />;
};
