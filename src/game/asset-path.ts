const baseUrl = import.meta.env.BASE_URL;

/**
 * Builds an asset URL relative to the Vite base path.
 *
 * @param path - Public asset path, with or without a leading slash.
 * @returns A URL that respects the configured deployment base.
 */
export const assetPath = (path: string): string => {
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${cleanBase}${cleanPath}`;
};
