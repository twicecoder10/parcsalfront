import { AppFooter } from '@/components/AppFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
      <AppFooter />
    </div>
  );
}

