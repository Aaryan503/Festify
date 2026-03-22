import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  const [interestStatuses, setInterestStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          
          // Fetch interest status for each event if user is logged in
          if (user) {
            const statusPromises = data.map(async (event: Event) => {
              try {
                const statusResponse = await axios.get(`/api/events/${event._id}/interested/status`, {
                  withCredentials: true
                });
                return { eventId: event._id, interested: statusResponse.data.interested };
              } catch (error) {
                console.error(`Error fetching interest status for event ${event._id}:`, error);
                return { eventId: event._id, interested: false };
              }
            });
            
            const statuses = await Promise.all(statusPromises);
            const statusMap = statuses.reduce((acc, status) => {
              acc[status.eventId] = status.interested;
              return acc;
            }, {} as Record<string, boolean>);
            
            setInterestStatuses(statusMap);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

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
                _id={event._id}
                title={event.title}
                organizer={event.organizer.name}
                date={formatDate(event.startTime)}
                time={formatTime(event.startTime)}
                image={event.image}
                location={event.location}
                description={event.description}
                endTime={formatTime(event.endTime)}
                variant={event.image ? 'featured' : 'list'}
                showInterestedButton={true}
                initialInterestedStatus={interestStatuses[event._id] || false}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
