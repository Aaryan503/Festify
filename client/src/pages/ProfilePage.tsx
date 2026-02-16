import { LogOut, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';

const EVENTS = [
  { id: 1, title: 'Cruxipher', organizer: 'cruX x CSA', date: 'NOV 4-5', time: '8PM-10PM' },
  {
    id: 2,
    title: 'Binary Battles',
    organizer: 'cruX',
    date: 'Nov 3rd',
    time: '5-6pm',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    location: 'New Football Ground',
  },
  { id: 3, title: 'Robo Wars', organizer: 'Automation Club', date: 'NOV 4', time: '10AM-4PM' },
  { id: 4, title: 'Hackathon', organizer: 'ACM Chapter', date: 'NOV 5', time: '9AM-9PM' },
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="p-5 lg:p-8">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-dark-accent/40 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dark-accent to-purple-800 flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.name || 'User'}</h2>
            <p className="text-dark-muted text-sm flex items-center gap-1.5 truncate">
              <Mail size={14} className="shrink-0" />
              {user?.email || 'email@example.com'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full glass rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </motion.div>

      {/* Registered events */}
      <h3 className="text-base font-bold mb-4">Your Events</h3>
      <div className="space-y-3">
        {EVENTS.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.06 * i }}
          >
            <EventCard
              title={event.title}
              organizer={event.organizer}
              date={event.date}
              time={event.time}
              image={event.image}
              location={event.location}
              variant={event.image ? 'featured' : 'list'}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
