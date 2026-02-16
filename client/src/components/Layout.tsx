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
      {showNav ? (
        <div className="lg:flex lg:h-screen">
          {/* Sidebar nav on desktop */}
          <Navbar />

          {/* Main content */}
          <main className="flex-1 pb-24 lg:pb-0 lg:overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
};

export default Layout;
