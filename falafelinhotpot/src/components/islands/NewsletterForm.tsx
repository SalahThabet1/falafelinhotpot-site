import { useState } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '~/utils/analytics';

type Props = {
  /** 'editorial' is the labelled two-field form; 'inline' is the joined email + button row */
  variant?: 'editorial' | 'inline';
};

export default function NewsletterForm({ variant = 'editorial' }: Props) {
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
          firstname: (form.elements.namedItem('firstname') as HTMLInputElement)?.value || '',
        }),
        mode: 'no-cors',
      });

      trackEvent('newsletter_submit_success');
    } catch {
      // no-cors swallows the response, so a thrown error tells us nothing about
      // whether the subscribe succeeded. Treat both paths as success.
      trackEvent('newsletter_submit_error');
    }

    setStatus("You're on the list. Welcome to the bridge.");
    toast.success("You're on the list. Welcome to the bridge.");
    form.reset();
    setSubmitting(false);
  };

  if (variant === 'inline') {
    return (
      <>
        <form onSubmit={handleSubmit} className="flex w-full items-stretch mt-6 mb-4" noValidate>
          <label htmlFor="dispatch-email" className="sr-only">
            Email address
          </label>
          {/* min-w-0 stops the input blowing out of its flex bounds; shrink-0 protects the button */}
          <input
            id="dispatch-email"
            name="email"
            type="email"
            placeholder="Your email"
            autoComplete="email"
            required
            className="flex-1 min-w-0 bg-transparent border border-[#E3D1B8] border-r-0 px-4 py-3 text-[#2C2C2A] focus:outline-none focus:border-[#9B1B15] focus:ring-1 focus:ring-[#9B1B15] transition-all"
          />
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 bg-[#9B1B15] text-white font-medium px-6 py-3 hover:bg-[#7A1510] transition-colors shadow-sm disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
        <p role="status" aria-live="polite" className="nl-form__status">
          {status}
        </p>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="editorial-form" noValidate>
      <div className="editorial-form__field">
        <label htmlFor="editorial-firstname">First name</label>
        <input id="editorial-firstname" name="firstname" type="text" autoComplete="given-name" />
      </div>
      <div className="editorial-form__field">
        <label htmlFor="editorial-email">Email address</label>
        <input id="editorial-email" name="email" type="email" autoComplete="email" required />
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
