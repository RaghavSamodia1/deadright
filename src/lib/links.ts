/**
 * Public web pages, served from GitHub Pages out of this repo's docs/ folder.
 *
 * They cannot live on Supabase: it rewrites text/html to text/plain with
 * nosniff on the shared *.supabase.co domain, for Storage as well as Functions.
 */
const SITE = 'https://raghavsamodia1.github.io/deadright';

export const links = {
  /** The showcase page, which is also where the Android build is offered. */
  site: SITE,
  privacy: `${SITE}/legal/privacy/`,
  terms: `${SITE}/legal/terms/`,
  /**
   * Invite target. An https page, not the deadright:// scheme the QR used to
   * carry — a camera pointed at a custom scheme does nothing at all unless the
   * app is already installed, which is precisely the wrong assumption for an
   * invite. The page hands the code to the app if it's there and offers the
   * install if it isn't.
   */
  join: (code: string) => `${SITE}/join/?c=${encodeURIComponent(code)}`,
};

/** The in-app route the join page hands off to. */
export const joinDeepLink = (code: string) => `deadright://join/${encodeURIComponent(code)}`;
