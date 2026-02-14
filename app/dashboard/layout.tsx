import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="mr-64 min-h-screen transition-all duration-300 ease-in-out flex flex-col">
        <Header />
        {children}
      </main>
    </div>
  );
}
