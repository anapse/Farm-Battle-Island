/**
 * Resolves static asset paths taking into account the configured Vite BASE_URL.
 * This guarantees seamless asset loading in both local development and GitHub Pages subpath deployments.
 */
export function getAssetUrl(relativePath: string): string {
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const base = import.meta.env.BASE_URL || './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${clean}`;
}
