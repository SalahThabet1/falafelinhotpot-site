import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'font-[family-name:var(--font-body)]',
        },
      }}
    />
  );
}
