/**
 * Resolves static asset paths taking into account the configured Vite BASE_URL.
 * Works in local development, GitHub Pages subpaths and root deployments.
 */
export function getAssetUrl(relativePath: string): string {
  const clean = relativePath
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${clean}`;
}
