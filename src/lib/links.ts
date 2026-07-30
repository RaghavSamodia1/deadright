/**
 * Public web pages, served from GitHub Pages out of this repo's docs/ folder.
 *
 * They cannot live on Supabase: it rewrites text/html to text/plain with
 * nosniff on the shared *.supabase.co domain, for Storage as well as Functions.
 */
const SITE = 'https://raghavsamodia1.github.io/deadright';

export const links = {
  privacy: `${SITE}/legal/privacy/`,
  terms: `${SITE}/legal/terms/`,
};
