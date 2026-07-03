import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/shadcn/ui/button';
import { Input } from '~/components/shadcn/ui/input';
import { Label } from '~/components/shadcn/ui/label';
import { trackEvent } from '~/utils/analytics';

type Props = {
  compact?: boolean;
  variant?: 'default' | 'hero' | 'dispatch' | 'editorial';
};

export default function NewsletterForm({ compact = false, variant = 'default' }: Props) {
  const isHero = variant === 'hero';
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement;
  }) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();

    if (!email || !email.includes('@')) {
      setStatus('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setStatus('');
    trackEvent('newsletter_submit_attempt');

    try {
      await fetch('https://falafelinhotpot.activehosted.com/proc.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          u: '6A149D8923A83',
          f: '9',
          s: '',
          c: '0',
          m: '0',
          act: 'sub',
          v: '2',
          or: 'b7a553f1-5419-4666-9786-87adb9281338',
          email,
          ...(compact
            ? {}
            : {
                firstname: (form.elements.namedItem('firstname') as HTMLInputElement)?.value || '',
              }),
        }),
        mode: 'no-cors',
      });

      trackEvent('newsletter_submit_success');
      setStatus("You're on the list. Welcome to the bridge.");
      toast.success("You're on the list. Welcome to the bridge.");
      form.reset();
    } catch {
      trackEvent('newsletter_submit_error');
      setStatus("You're on the list. Welcome to the bridge.");
      toast.success("You're on the list. Welcome to the bridge.");
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'editorial') {
    return (
      <form onSubmit={handleSubmit} className="editorial-form" noValidate>
        <div className="editorial-form__field">
          <label htmlFor="editorial-firstname">First name</label>
          <input id="editorial-firstname" name="firstname" type="text" autoComplete="given-name" />
        </div>
        <div className="editorial-form__field">
          <label htmlFor="editorial-email">Email address</label>
          <input
            id="editorial-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Subscribe'}
        </button>
        <p role="status" aria-live="polite" className="editorial-form__status">
          {status}
        </p>
      </form>
    );
  }

  if (variant === 'dispatch') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md mx-auto" noValidate>
        <div>
          <label htmlFor="dispatch-firstname" className="sr-only">First name</label>
          <input
            id="dispatch-firstname"
            name="firstname"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            className="w-full bg-transparent border-0 border-b border-[#E3D1B8] px-2 py-3 text-[#2C2C2A] placeholder:text-[#2C2C2A]/40 focus:outline-none focus:border-[#9B1B15] transition-colors rounded-none"
          />
        </div>
        <div>
          <label htmlFor="dispatch-email" className="sr-only">Email address</label>
          <input
            id="dispatch-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            required
            className="w-full bg-transparent border-0 border-b border-[#E3D1B8] px-2 py-3 text-[#2C2C2A] placeholder:text-[#2C2C2A]/40 focus:outline-none focus:border-[#9B1B15] transition-colors rounded-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 bg-[#9B1B15] text-white font-medium py-4 tracking-wide hover:bg-[#7A1510] transition-colors rounded-sm shadow-sm cursor-pointer disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Subscribe'}
        </button>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-center text-[#4A4A48]">
          {status}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="newsletter-form flex flex-col gap-3" noValidate>
      {!compact && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstname">First name</Label>
          <Input
            id="firstname"
            name="firstname"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
          />
        </div>
      )}
      {compact ? (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1">
            <Label htmlFor="email" className={isHero ? 'sr-only' : undefined}>
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              required
              className={
                isHero
                  ? 'h-11 w-full rounded-sm border-xuan-300/60 bg-xuan-100/40 px-3 backdrop-blur-sm'
                  : 'sm:rounded-none'
              }
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className={
              isHero
                ? 'h-11 shrink-0 rounded-sm bg-cinnabar px-6 font-medium text-xuan-100 hover:bg-cinnabar-dark sm:self-end'
                : 'shrink-0 sm:h-8'
            }
          >
            {submitting ? 'Sending…' : 'Subscribe'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-0">
          <div className="flex flex-1 flex-col gap-2 sm:mr-0">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              required
              className="sm:rounded-none"
            />
          </div>
          <Button type="submit" disabled={submitting} className="shrink-0 sm:h-8">
            {submitting ? 'Sending…' : 'Subscribe'}
          </Button>
        </div>
      )}
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-[var(--color-text-muted)]"
      >
        {status}
      </p>
    </form>
  );
}
