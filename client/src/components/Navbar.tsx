import { Link, useLocation } from 'react-router-dom';
import { Home, Flag, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/events', icon: Flag, label: 'Events' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/profile', icon: User, label: 'Profile' },
] as const;

const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen glass-strong border-r border-white/5 p-6 shrink-0">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">
            PEARL{' '}
            <span className="text-[10px] text-dark-muted align-center leading-none inline-block">
              20<br />26
            </span>
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-dark-accent/15 text-dark-accent-light'
                    : 'text-dark-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}

          {(user?.role === 'Event Manager' || user?.role === 'Fest Organizing Body') && (
             <Link
                to="/manager"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  pathname === '/manager'
                    ? 'bg-dark-accent/15 text-dark-accent-light'
                    : 'text-dark-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Flag size={20} strokeWidth={pathname === '/manager' ? 2.5 : 1.8} />
                <span className="text-sm font-medium">Manager Dashboard</span>
              </Link>
          )}
        </nav>

        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors mt-auto"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dark-accent to-purple-800 flex items-center justify-center text-xs font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-dark-muted truncate">{user.email}</p>
            </div>
          </Link>
        )}
      </aside>
    </>
  );
};

export default Navbar;
