import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';

interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="p-5 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          PEARL{' '}
          <span className="text-[10px] text-dark-muted align-center leading-none inline-block">
            20<br />26
          </span>
        </h1>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <MoreVertical size={20} className="text-dark-muted" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-white">Loading events...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-dark-muted text-lg">No events available</p>
          <p className="text-dark-muted text-sm mt-2">Check back later for upcoming events!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <EventCard
                title={event.title}
                organizer={event.organizer.name}
                date={formatDate(event.startTime)}
                time={formatTime(event.startTime)}
                image={event.image}
                location={event.location}
                description={event.description}
                endTime={formatTime(event.endTime)}
                variant={event.image ? 'featured' : 'list'}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
