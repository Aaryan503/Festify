import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Calendar, MessageCircle } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/home', icon: Home },
  { path: '/events', icon: Play },
  { path: '/schedule', icon: Calendar },
  { path: '/profile', icon: MessageCircle },
] as const;

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto px-4 pb-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex justify-around items-center">
          {NAV_ITEMS.map(({ path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-dark-accent/20 text-dark-accent-light'
                    : 'text-dark-muted hover:text-white'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
