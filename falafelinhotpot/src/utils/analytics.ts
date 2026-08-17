/**
 * GA4 event helper for Falafel in Hotpot.
 *
 * Usage:
 *   import { trackEvent } from '~/utils/analytics';
 *   trackEvent('subscribe_cta_click', { location: 'nav' });
 *
 * Events implemented:
 *   page_view, 404_page_view
 *   subscribe_cta_click, newsletter_submit_attempt, newsletter_submit_success, newsletter_submit_error
 *   edition_page_view, edition_card_click
 *   category_filter_click, tag_click
 *   course_cta_click, course_register_click
 *   payment_link_click, whatsapp_cta_click
 *   social_link_click, outbound_link_click
 *
 * No PII is ever sent (emails, names, user IDs are excluded).
 */

type GtagEvent =
  | 'page_view'
  | '404_page_view'
  | 'subscribe_cta_click'
  | 'newsletter_submit_attempt'
  | 'newsletter_submit_success'
  | 'newsletter_submit_error'
  | 'edition_page_view'
  | 'edition_card_click'
  | 'category_filter_click'
  | 'tag_click'
  | 'course_cta_click'
  | 'course_register_click'
  | 'payment_link_click'
  | 'whatsapp_cta_click'
  | 'social_link_click'
  | 'outbound_link_click';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: GtagEvent, params?: EventParams): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params ?? {});
}
