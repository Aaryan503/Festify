import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const showNav = pathname !== '/';

  return (
    <div className="min-h-screen bg-dark-bg font-sans">
      <div className="max-w-md mx-auto min-h-screen relative bg-dark-bg shadow-[0_0_80px_rgba(108,93,211,0.05)]">
        <main className={showNav ? 'pb-24' : ''}>
          {children}
        </main>
        {showNav && <Navbar />}
      </div>
    </div>
  );
};

export default Layout;
