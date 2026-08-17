export type SharePlatform =
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'whatsapp'
  | 'reddit'
  | 'telegram'
  | 'mail'
  | 'instagram'
  | 'tiktok'
  | 'snapchat';

export type ShareNetwork = {
  id: SharePlatform;
  label: string;
  icon: string;
  /** Opens in a new tab when set */
  href?: string;
  /** Copies the page URL when true (Instagram, TikTok, Snapchat have no web share intent) */
  copyLink?: boolean;
};

export function buildShareHref(
  platform: SharePlatform,
  url: string,
  text: string
): string | undefined {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const combined = encodeURIComponent(`${text} ${url}`);

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${combined}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'mail':
      return `mailto:?subject=${encodedText}&body=${combined}`;
    case 'instagram':
    case 'tiktok':
    case 'snapchat':
      return undefined;
  }
}

export function getShareNetworks(url: string, text: string): ShareNetwork[] {
  const platforms: Array<Omit<ShareNetwork, 'href'> & { href?: string }> = [
    { id: 'twitter', label: 'Share on X', icon: 'tabler:brand-x' },
    { id: 'facebook', label: 'Share on Facebook', icon: 'tabler:brand-facebook' },
    { id: 'linkedin', label: 'Share on LinkedIn', icon: 'tabler:brand-linkedin' },
    { id: 'whatsapp', label: 'Share on WhatsApp', icon: 'tabler:brand-whatsapp' },
    { id: 'reddit', label: 'Share on Reddit', icon: 'tabler:brand-reddit' },
    { id: 'telegram', label: 'Share on Telegram', icon: 'tabler:brand-telegram' },
    {
      id: 'instagram',
      label: 'Copy link to share on Instagram',
      icon: 'simple-icons:instagram',
      copyLink: true,
    },
    {
      id: 'tiktok',
      label: 'Copy link to share on TikTok',
      icon: 'simple-icons:tiktok',
      copyLink: true,
    },
    {
      id: 'snapchat',
      label: 'Copy link to share on Snapchat',
      icon: 'simple-icons:snapchat',
      copyLink: true,
    },
    { id: 'mail', label: 'Share by email', icon: 'tabler:mail' },
  ];

  return platforms.map((platform) => ({
    ...platform,
    href: platform.copyLink ? undefined : buildShareHref(platform.id, url, text),
  }));
}
