import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from '../components/Calendar';
import { Clock, CalendarDays, Heart, Globe } from 'lucide-react';
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

const SchedulePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [filter, setFilter] = useState<'all' | 'interested'>('all');

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setAllEvents(data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch interested events when user is logged in
  useEffect(() => {
    const fetchInterestedEvents = async () => {
      if (!user) return;
      try {
        const response = await axios.get('/api/events/interested/my-events', {
          params: { limit: 100 },
          withCredentials: true,
        });
        setInterestedEvents(response.data.events || []);
      } catch (error) {
        console.error('Error fetching interested events:', error);
      }
    };

    fetchInterestedEvents();
  }, [user]);

  // Determine which events to display
  const displayEvents = filter === 'interested' ? interestedEvents : allEvents;

  const handleEventClick = (event: Event) => {
    // Navigate to directions page with the event location as venue
    const location = event.location;
    navigate(`/directions/${encodeURIComponent(location)}`);
  };

  if (loading) {
    return (
      <div className="p-5 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-dark-accent border-t-transparent animate-spin"
            />
            <span className="text-[#8888A0] text-sm font-medium">Loading schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (allEvents.length === 0) {
    return (
      <div className="p-5 lg:p-8">
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-[#8888A0] text-lg font-medium">No events scheduled</p>
          <p className="text-[#8888A0]/60 text-sm mt-2">Check back later for upcoming events!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          className="text-2xl font-bold tracking-tight mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Schedule
        </motion.h1>
        <p className="text-[#8888A0] text-sm">
          {viewMode === 'today' ? "Today's events timeline" : 'All scheduled events across days'}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* View mode toggle (Today / All Days) */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            onClick={() => setViewMode('today')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: viewMode === 'today' ? 'rgba(108, 93, 211, 0.8)' : 'transparent',
              color: viewMode === 'today' ? '#fff' : '#8888A0',
              boxShadow: viewMode === 'today' ? '0 2px 8px rgba(108, 93, 211, 0.3)' : 'none',
            }}
          >
            <Clock size={15} />
            Today
          </button>

          <button
            onClick={() => setViewMode('all')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: viewMode === 'all' ? 'rgba(108, 93, 211, 0.8)' : 'transparent',
              color: viewMode === 'all' ? '#fff' : '#8888A0',
              boxShadow: viewMode === 'all' ? '0 2px 8px rgba(108, 93, 211, 0.3)' : 'none',
            }}
          >
            <CalendarDays size={15} />
            All Days
          </button>
        </div>

        {/* Filter toggle (All Events / Interested) */}
        {user && (
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              onClick={() => setFilter('all')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: filter === 'all' ? 'rgba(99, 179, 163, 0.7)' : 'transparent',
                color: filter === 'all' ? '#fff' : '#8888A0',
                boxShadow: filter === 'all' ? '0 2px 8px rgba(99, 179, 163, 0.25)' : 'none',
              }}
            >
              <Globe size={15} />
              All Events
            </button>

            <button
              onClick={() => setFilter('interested')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: filter === 'interested' ? 'rgba(239, 68, 68, 0.7)' : 'transparent',
                color: filter === 'interested' ? '#fff' : '#8888A0',
                boxShadow: filter === 'interested' ? '0 2px 8px rgba(239, 68, 68, 0.25)' : 'none',
              }}
            >
              <Heart size={15} />
              Interested
              {interestedEvents.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: filter === 'interested' ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.3)',
                    color: filter === 'interested' ? '#fff' : '#ef4444',
                  }}
                >
                  {interestedEvents.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Calendar timeline */}
      <motion.div
        key={`${viewMode}-${filter}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Calendar
          events={displayEvents}
          mode={viewMode}
          onEventClick={handleEventClick}
        />
      </motion.div>
    </div>
  );
};

export default SchedulePage;
