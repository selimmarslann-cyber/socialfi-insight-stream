import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)]">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
