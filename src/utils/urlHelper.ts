/**
 * Utility for parsing and extracting metadata from URLs for live bookmark previews with OpenGraph images
 */

export function isWebUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();

  // Basic guard against long multi-line text or paragraphs
  if (trimmed.includes('\n') || trimmed.length > 2000) return false;

  // Direct http/https prefixes
  if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return true;
  }

  // Domain-like patterns (e.g. github.com/user, news.ycombinator.com, apple.com)
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+(\/[^\s]*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

const POPULAR_DOMAINS: Record<string, string> = {
  'github.com': 'GitHub',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'x.com': 'X (Twitter)',
  'twitter.com': 'X (Twitter)',
  'figma.com': 'Figma',
  'dribbble.com': 'Dribbble',
  'behance.net': 'Behance',
  'medium.com': 'Medium',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'notion.so': 'Notion',
  'linear.app': 'Linear',
  'apple.com': 'Apple',
  'google.com': 'Google',
  'wikipedia.org': 'Wikipedia',
  'unsplash.com': 'Unsplash',
  'pinterest.com': 'Pinterest',
  'substack.com': 'Substack',
  'nytimes.com': 'The New York Times',
  'theverge.com': 'The Verge',
  'producthunt.com': 'Product Hunt',
  'stackoverflow.com': 'Stack Overflow',
};

export interface LinkMetadata {
  url: string;
  domain: string;
  title: string;
  description: string;
  favicon: string;
  image?: string;
}

export function parseUrlMetadata(input: string): LinkMetadata {
  let cleanUrl = input.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let domain = 'web';
  let title = '';
  let description = '';
  let image: string | undefined = undefined;

  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname.replace(/^www\./, '');

    // 1. Generate clean title
    const baseName = POPULAR_DOMAINS[domain] || domain.split('.')[0];
    const capitalizedBase = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    const pathSegments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        return decodeURIComponent(segment)
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      });

    if (pathSegments.length > 0) {
      const lastSlug = pathSegments[pathSegments.length - 1];
      if (lastSlug.length > 2 && !/^\d+$/.test(lastSlug)) {
        title = `${lastSlug} — ${capitalizedBase}`;
      } else {
        title = `${pathSegments.join(' / ')} · ${capitalizedBase}`;
      }
    } else {
      title = capitalizedBase;
    }

    // 2. Generate description
    if (parsed.pathname && parsed.pathname !== '/') {
      description = `Resource on ${domain}${parsed.pathname}`;
    } else {
      description = `Official website for ${capitalizedBase}`;
    }

    // 3. Instant platform-specific OpenGraph images
    // YouTube video thumbnail
    const ytMatch = cleanUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      image = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    // GitHub repository OpenGraph card
    const ghMatch = cleanUrl.match(/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/);
    if (ghMatch) {
      image = `https://opengraph.githubassets.com/1/${ghMatch[1]}/${ghMatch[2]}`;
    }

    // Direct image links
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(parsed.pathname)) {
      image = cleanUrl;
    }
  } catch {
    domain = 'web';
    title = cleanUrl;
    description = 'Web bookmark';
  }

  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return {
    url: cleanUrl,
    domain,
    title,
    description,
    favicon,
    image,
  };
}

/**
 * Asynchronously fetch real OpenGraph metadata (og:image, og:title, og:description)
 * via Microlink API with a 5-second timeout and graceful fallback.
 */
export async function fetchOpenGraphData(rawUrl: string): Promise<Partial<LinkMetadata> | null> {
  let cleanUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();

    if (json.status === 'success' && json.data) {
      const data = json.data;
      return {
        title: data.title || undefined,
        description: data.description || undefined,
        image: data.image?.url || undefined,
        favicon: data.logo?.url || undefined,
      };
    }
  } catch {
    // Offline or aborted — fail silently
  }
  return null;
}
