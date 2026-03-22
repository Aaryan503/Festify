import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Calendar from '../components/Calendar';
import { Calendar as CalendarIcon, List } from 'lucide-react';

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

interface GroupedEvents {
  [date: string]: Event[];
}

const SchedulePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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

  useEffect(() => {
    if (events.length > 0) {
      const grouped: GroupedEvents = {};
      
      events.forEach(event => {
        const startDate = new Date(event.startTime);
        const dateKey = startDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(event);
      });
      
      // Sort events within each date by start time
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      });
      
      setGroupedEvents(grouped);
    }
  }, [events]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="p-5 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading schedule...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-5 lg:p-8">
        <div className="text-center py-20">
          <p className="text-dark-muted text-lg">No events scheduled</p>
          <p className="text-dark-muted text-sm mt-2">Check back later for upcoming events!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-dark-accent text-white'
                  : 'text-dark-muted hover:text-white'
              }`}
            >
              <CalendarIcon size={16} />
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-dark-accent text-white'
                  : 'text-dark-muted hover:text-white'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
        
        <p className="text-dark-muted text-sm">
          {viewMode === 'calendar' ? 'Calendar view of all events' : 'All events organized by date'}
        </p>
      </div>

      {viewMode === 'calendar' ? (
        <Calendar 
          events={events} 
          onEventClick={(event) => {
            // You can add modal or navigation logic here
            console.log('Event clicked:', event);
          }}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dateEvents], dateIndex) => (
            <div key={date}>
              {dateIndex > 0 && (
                <div className="border-b border-white/20 my-8"></div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-lg font-bold text-white mb-4">{date}</h2>
                
                <div className="space-y-3">
                  {dateEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => {
                        // You can add modal or navigation logic here
                        console.log('Event clicked:', event);
                      }}
                    >
                      <div className="text-sm font-medium text-dark-accent w-20">
                        {formatTime(event.startTime)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-sm text-dark-muted">
                          📍 {event.location} • 👤 {event.organizer.name}
                        </p>
                      </div>
                      
                      <div className="text-xs text-white/60">
                        {formatTime(event.endTime)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
