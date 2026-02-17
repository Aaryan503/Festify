import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, MapPin, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/ui/CustomSelect';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import CustomTimePicker from '../components/ui/CustomTimePicker';

interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  startTime: string; // Start DateTime
  endTime: string; // End DateTime
  category: string;
}

const ManagerDashboard = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const fetchEvents = async () => {
    try {
      setFetching(true);
      const { data } = await axios.get('/api/events/my-events', { withCredentials: true });
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchEvents();
    }
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return alert("Please select a date");

    setLoading(true);
    try {
      // Combine Date + Time
      const startDateTime = new Date(selectedDate);
      const [startH, startM] = startTime.split(':').map(Number);
      startDateTime.setHours(startH, startM);

      const endDateTime = new Date(selectedDate);
      const [endH, endM] = endTime.split(':').map(Number);
      endDateTime.setHours(endH, endM);

      // Basic validation
      if (endDateTime <= startDateTime) {
        alert('End time must be after start time');
        return;
      }

      await axios.post('/api/events', {
        title,
        description,
        image,
        location,
        category,
        startTime: startDateTime, 
        endTime: endDateTime
      }, { withCredentials: true });

      // Reset form
      setTitle('');
      setDescription('');
      setImage('');
      setLocation('');
      setCategory('');
      setStartTime('09:00');
      setEndTime('17:00');
      
      setView('list');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12"> 
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Manager Dashboard
            </h1>
            <p className="text-dark-muted mt-1">Manage your events and listings</p>
          </div>
          
          {view === 'list' && (
            <button
              onClick={() => setView('create')}
              className="bg-dark-accent hover:bg-dark-accent-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} />
              Create New Event
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <button 
                onClick={() => setView('list')}
                className="mb-6 flex items-center gap-2 text-dark-muted hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back to Events
              </button>

              <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-xl">
                <h2 className="text-2xl font-bold mb-8">Create New Event</h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Event Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-colors placeholder:text-dark-muted/50"
                            placeholder="e.g. Summer Music Festival"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <CustomSelect
                            label="Category"
                            value={category}
                            onChange={setCategory}
                            options={[
                                { id: 'Music', label: 'Music' },
                                { id: 'Workshop', label: 'Workshop' },
                                { id: 'Tech', label: 'Tech' },
                                { id: 'Art', label: 'Art' },
                                { id: 'Sports', label: 'Sports' },
                                { id: 'Other', label: 'Other' },
                            ]}
                         />
                         
                         <div>
                            <label className="block text-sm font-medium text-dark-muted mb-2">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-colors placeholder:text-dark-muted/50"
                                    placeholder="Venue or Address"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-dark-accent" />
                        Date & Time
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CustomDatePicker
                            label="Date"
                            value={selectedDate}
                            onChange={setSelectedDate}
                        />
                        <CustomTimePicker
                            label="Start Time"
                            value={startTime}
                            onChange={setStartTime}
                        />
                         <CustomTimePicker
                            label="End Time"
                            value={endTime}
                            onChange={setEndTime}
                        />
                    </div>
                  </div>

                  {/* Media & Details */}
                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Cover Image URL</label>
                        <input
                            type="url"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-colors placeholder:text-dark-muted/50"
                            placeholder="https://example.com/image.jpg"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Description</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-colors resize-none placeholder:text-dark-muted/50"
                            placeholder="Tell people what your event is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="px-6 py-3 rounded-xl text-dark-muted hover:text-white font-medium transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-dark-accent hover:bg-dark-accent-light text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Creating...' : 'Publish Event'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {fetching ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 size={32} className="animate-spin text-dark-accent" />
                 </div>
              ) : events.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-12 text-center text-dark-muted border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
                    <p className="mb-6 max-w-sm">You haven't created any events yet. Get started by creating your first event.</p>
                    <button
                        onClick={() => setView('create')}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium transition-all cursor-pointer"
                    >
                        Create Event
                    </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                    <div key={event._id} className="glass-card rounded-2xl overflow-hidden border border-white/5 group hover:border-dark-accent/30 transition-all flex flex-col h-full"> 
                        <div className="h-48 overflow-hidden relative shrink-0">
                            <img 
                                src={event.image} 
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                                {event.category}
                            </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                            <p className="text-dark-muted text-sm line-clamp-2 mb-4 flex-1">{event.description}</p>
                            
                            <div className="flex flex-col gap-2 text-sm text-dark-muted border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-dark-accent" />
                                    <span>
                                        {new Date(event.startTime).toLocaleDateString()} 
                                        <span className="mx-1">•</span>
                                        {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                {event.endTime && (
                                     <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-dark-accent" />
                                        <span>
                                            Ends: {new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-dark-accent" />
                                    <span className="truncate">{event.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManagerDashboard;
