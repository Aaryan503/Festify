import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';

/* Dummy event data */
const EVENTS = [
  { id: 1, title: 'Cruxipher', organizer: 'cruX x CSA', date: 'NOV 4-5', time: '8PM-10PM' },
  {
    id: 2,
    title: 'Binary Battles',
    organizer: 'cruX',
    date: 'Nov 3rd',
    time: '5-6pm',
    image: 'https://images.unsplash.com/photo-1526615735655-cf99166f2123?auto=format&fit=crop&q=80&w=600',
    location: 'New Football Ground',
  },
  { id: 3, title: 'Robo Wars', organizer: 'Automation Club', date: 'NOV 4', time: '10AM-4PM' },
  { id: 4, title: 'Hackathon', organizer: 'ACM Chapter', date: 'NOV 5', time: '9AM-9PM' },
];

const ProfilePage = () => {
  return (
    <div className="p-5">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Festify{' '}
          <span className="text-[10px] text-dark-muted align-top leading-none inline-block">
            20<br />25
          </span>
        </h1>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dark-accent to-purple-800 flex items-center justify-center text-sm font-bold">
          U
        </div>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search for Events"
          className="w-full glass rounded-2xl py-3 px-4 pr-10 text-sm placeholder-dark-muted focus:outline-none focus:ring-1 focus:ring-dark-accent/40 transition-all bg-transparent"
        />
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-muted" />
      </div>

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
