import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '../components/EventCard';
import CustomSelect from '../components/ui/CustomSelect';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import CustomTimePicker from '../components/ui/CustomTimePicker';

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

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchName, setSearchName] = useState('');

  // Filter states
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Category options - you can fetch these from backend or define them
  const categoryOptions = [
    { id: '', label: 'All Categories' },
    { id: 'concert', label: 'Concert' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'competition', label: 'Competition' },
    { id: 'exhibition', label: 'Exhibition' },
    { id: 'seminar', label: 'Seminar' },
    { id: 'sports', label: 'Sports' },
    { id: 'cultural', label: 'Cultural' },
    { id: 'other', label: 'Other' },
  ];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage.toString(),
        limit: '12',
      };

      // Determine which endpoint to use
      const hasFilters = category || location || startDate || endDate || startTime || endTime;
      const hasSearch = searchName.trim().length > 0;

      let response;
      if (hasSearch && !hasFilters) {
        // Use search endpoint when only name is provided
        params.name = searchName.trim();
        response = await axios.get('/api/events/search', { params, withCredentials: true });
      } else if (hasFilters) {
        // Use filter endpoint when filters are provided
        if (category) params.category = category;
        if (location) params.location = location;
        if (startDate) {
          params.startDate = startDate.toISOString().split('T')[0];
        }
        if (endDate) {
          params.endDate = endDate.toISOString().split('T')[0];
        }
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        
        response = await axios.get('/api/events/filter', { params, withCredentials: true });
        
        // If search name is also provided, filter client-side
        if (hasSearch) {
          response.data.events = response.data.events.filter((event: Event) =>
            event.title.toLowerCase().includes(searchName.trim().toLowerCase())
          );
          // Update pagination info
          response.data.pagination.totalItems = response.data.events.length;
          response.data.pagination.totalPages = Math.ceil(response.data.events.length / parseInt(params.limit));
        }
      } else {
        // No search or filters - use search endpoint without name to get all events
        response = await axios.get('/api/events/search', { params, withCredentials: true });
      }

      setEvents(response.data.events || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchName, category, location, startDate, endDate, startTime, endTime]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setCategory('');
    setLocation('');
    setStartDate(null);
    setEndDate(null);
    setStartTime('');
    setEndTime('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const hasActiveFilters = category || location || startDate || endDate || startTime || endTime;

  return (
    <div className="p-5 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search events by name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-dark-muted focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-all"
          />
        </div>
      </form>

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:border-dark-accent/30 transition-all"
        >
          <Filter size={18} />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-dark-accent text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-dark-muted hover:text-white transition-colors flex items-center gap-1"
          >
            <X size={16} />
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 mb-6 overflow-visible relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
              <CustomSelect
                label="Category"
                value={category}
                onChange={(value) => {
                  setCategory(value);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
                placeholder="All Categories"
              />
              
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Enter location..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-muted focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-all"
                />
              </div>

              <CustomDatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setCurrentPage(1);
                }}
                placeholder="Select start date"
              />

              <CustomDatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setCurrentPage(1);
                }}
                placeholder="Select end date"
              />

              <CustomTimePicker
                label="Start Time"
                value={startTime}
                onChange={(time) => {
                  setStartTime(time);
                  setCurrentPage(1);
                }}
              />

              <CustomTimePicker
                label="End Time"
                value={endTime}
                onChange={(time) => {
                  setEndTime(time);
                  setCurrentPage(1);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-dark-accent" size={32} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-dark-muted text-lg">No events found</p>
          <p className="text-dark-muted text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {events.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <EventCard
                  title={event.title}
                  organizer={event.organizer?.name || 'Unknown'}
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

          {/* Pagination */}
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
                <span className="text-sm text-dark-muted">
                  {pagination.totalItems} events
                </span>
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

export default EventsPage;
