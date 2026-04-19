import { Heart, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

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
  interestedUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [interestStatuses, setInterestStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get<Event[]>(`${API}/api/events`);
        setEvents(data);

        // Fetch interest status for each event if user is logged in
        if (user) {
          const statusPromises = data.map(async (event: Event) => {
            try {
              const statusResponse = await axios.get(`${API}/api/events/${event._id}/interested/status`, {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          PEARL{' '}
          <span className="text-[10px] text-dark-muted align-center leading-none inline-block">
            20<br />26
          </span>
        </h1>
        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-dark-muted flex items-center gap-1"><span>🎭</span><span className="font-bold text-white">{events.length}</span></span>
            <span className="text-dark-muted/30">·</span>
            <span className="text-[10px] text-dark-muted flex items-center gap-1"><span>👣</span><span className="font-bold text-purple-400">{events.reduce((acc, ev) => acc + (ev.interestedUsers?.length || 0), 0)}</span></span>
            <span className="text-dark-muted/30">·</span>
            <span className="text-[10px] text-dark-muted flex items-center gap-1"><span>🏷️</span><span className="font-bold text-white">{new Set(events.map(e => e.category)).size}</span></span>
          </div>
        )}
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
        <div className="flex flex-col gap-8">

          {/* Top Interested Events Carousel */}
          {(() => {
            const topEvents = [...events]
              .sort((a, b) => (b.interestedUsers?.length || 0) - (a.interestedUsers?.length || 0))
              .slice(0, 6);
            if (topEvents.length === 0) return null;
            return (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end px-1">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block"></span>
                    Trending Events
                  </h2>
                </div>
                <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                  <div className="flex touch-pan-y">
                    {topEvents.map((event) => (
                      <div key={`top-${event._id}`} className="min-w-0 flex-[0_0_100%] cursor-grab active:cursor-grabbing">
                        <div className="relative aspect-[3/4] sm:aspect-[16/9] md:aspect-[2/1] sm:max-h-[500px] w-full overflow-hidden">
                          <img
                            src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-cover select-none"
                            draggable={false}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent sm:bg-gradient-to-r sm:from-dark-bg sm:via-dark-bg/80 sm:to-transparent" />
                          <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-end sm:justify-center w-full sm:w-2/3 lg:w-1/2">
                            <div className="flex gap-2 items-center text-[10px] sm:text-xs text-pink-400 font-black tracking-widest mb-1 sm:mb-2 uppercase">
                              <span className="bg-pink-500/20 px-2 py-0.5 rounded">#1 Trending</span>
                              {event.category}
                            </div>
                            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 leading-tight drop-shadow-lg">
                              {event.title}
                            </h3>
                            <p className="text-gray-300 text-xs sm:text-sm max-w-lg mb-3 sm:mb-5 line-clamp-2 sm:line-clamp-3 drop-shadow-md">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2">
                              {user && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const response = await axios.post(`${API}/api/events/${event._id}/interested/toggle`, {}, { withCredentials: true });
                                      setInterestStatuses(prev => ({ ...prev, [event._id]: response.data.interested }));
                                    } catch (error) { console.error(error); }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors backdrop-blur-sm ${
                                    interestStatuses[event._id]
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30'
                                  }`}
                                >
                                  <Heart size={13} className={interestStatuses[event._id] ? 'fill-green-300' : ''} />
                                  {interestStatuses[event._id] ? 'Interested' : 'Interested'}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/directions/${event.location}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors backdrop-blur-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                              >
                                <Navigation size={13} />
                                Directions
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All Events List (Capped) */}
          <div className="flex flex-col gap-4 mt-2">
             <div className="flex items-center gap-2 px-1 mb-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full inline-block"></span>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Discover More
                </h2>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 12).map((event, i) => (
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
                    onInterestChange={(interested) => {
                      setInterestStatuses(prev => ({ ...prev, [event._id]: interested }));
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
