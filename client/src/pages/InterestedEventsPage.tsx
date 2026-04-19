import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';

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
  organizer?: {
    name: string;
    email: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const InterestedEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInterestedEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/events/interested/my-events`, {
        params: { page: currentPage, limit: 12 },
        withCredentials: true,
      });
      setEvents(response.data.events || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Error fetching interested events:', error);
      setEvents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchInterestedEvents();
  }, [fetchInterestedEvents]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="p-5 lg:p-8 relative">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Interested Events</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-dark-accent" size={32} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-dark-muted text-lg">No interested events yet</p>
          <p className="text-dark-muted text-sm mt-2">Mark events as interested from the Events tab</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 relative z-10">
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
                  organizer={event.organizer?.name || 'Unknown'}
                  date={formatDate(event.startTime)}
                  time={formatTime(event.startTime)}
                  image={event.image}
                  location={event.location}
                  description={event.description}
                  endTime={formatTime(event.endTime)}
                  variant={event.image ? 'featured' : 'list'}
                  showInterestedButton={false}
                  showChatButton={true}
                  onViewChat={() => navigate(`/events/${event._id}/chat`)}
                />
              </motion.div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 glass rounded-xl transition-all ${
                  pagination.hasPrevPage
                    ? 'hover:border-dark-accent/30 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-muted">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <span className="text-dark-muted">•</span>
                <span className="text-sm text-dark-muted">{pagination.totalItems} events</span>
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 glass rounded-xl transition-all ${
                  pagination.hasNextPage
                    ? 'hover:border-dark-accent/30 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterestedEventsPage;
