import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Calendar, MapPin, Loader2, ArrowLeft, Clock, Edit2, Trash2, Send, Users, MessageCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/ui/CustomSelect';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import CustomTimePicker from '../components/ui/CustomTimePicker';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { nodes } from '../utils/navigationGraph';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend
} from 'recharts';
interface Event {
  _id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  startTime: string; // Start DateTime
  endTime: string; // End DateTime
  category: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface ApprovalEvent {
  _id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected';
  organizer?: {
    name: string;
    email: string;
    role?: string;
  };
}

interface TopEvent {
  title: string;
  interestedCount: number;
}

interface FestAnalyticsData {
  totalUniqueInterested: number;
  totalEvents: number;
  totalChatMessages: number;
  avgInterestPerEvent: number;
  topEvents: TopEvent[];
  categoryDistribution: { category: string; count: number }[];
  interestTrend: { date: string; count: number }[];
  overallBatchBreakdown: Record<string, number>;
  eventsTimeline: { date: string; count: number }[];
  venuePopularity: { venue: string; interestedCount: number }[];
}

// ─── Fest Analytics chart colors ───
const FEST_PIE_COLORS = ['#6C5DD3', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
const FEST_TOOLTIP = {
  contentStyle: {
    background: 'rgba(26,26,46,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
    backdropFilter: 'blur(12px)',
  },
  itemStyle: { color: '#A78BFA' },
  labelStyle: { color: '#8888A0', fontWeight: 600 },
};

const FestStatCard = ({ icon: Icon, label, value, sub, color, delay }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col gap-3"
    style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(16px)' }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <span className="text-dark-muted text-sm font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}99)`, WebkitBackgroundClip: 'text' }}>
      {value}
    </p>
    {sub && <p className="text-xs text-dark-muted">{sub}</p>}
  </motion.div>
);

const FestSectionCard = ({ title, children, delay = 0, className = '' }: {
  title: string; children: React.ReactNode; delay?: number; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`p-6 rounded-2xl border border-white/5 shadow-xl ${className}`}
    style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(16px)' }}
  >
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <BarChart3 size={18} className="text-dark-accent" />
      {title}
    </h3>
    {children}
  </motion.div>
);

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');

  // Build venue options from navigationGraph (only nodes marked as venues)
  const venueOptions = useMemo(() =>
    Object.values(nodes)
      .filter(n => n.isVenue)
      .map(n => ({ id: n.name, label: n.name })),
    []
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const role = user?.role;

  const [approvalTab, setApprovalTab] = useState<'pending' | 'approved' | 'create' | 'promote' | 'analytics'>('pending');
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<ApprovalEvent[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  // Fest Organizing Body: promote Event Managers
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMessage, setPromoteMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');


  // States for Fest Analytics
  const [festAnalytics, setFestAnalytics] = useState<FestAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
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
    if (role === 'Event Manager' && view === 'list') {
      fetchEvents();
    }
  }, [view, role]);

  const fetchPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const { data } = await axios.get('/api/events/approvals/pending', { withCredentials: true });
      setPendingApprovals(data?.events || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchApprovedEventsForOrganizingBody = async () => {
    try {
      setApprovalsLoading(true);
      const { data } = await axios.get('/api/events', { withCredentials: true });
      setApprovedEvents(data || []);
    } catch (error) {
      console.error('Error fetching approved events:', error);
      setApprovedEvents([]);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchFestAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const { data } = await axios.get('/api/events/fest-analytics', { withCredentials: true });
      setFestAnalytics(data);
    } catch (error) {
      console.error('Error fetching fest analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (role !== 'Fest Organizing Body') return;

    if (approvalTab === 'pending') fetchPendingApprovals();
    if (approvalTab === 'approved') fetchApprovedEventsForOrganizingBody();
    if (approvalTab === 'analytics') fetchFestAnalytics();
  }, [approvalTab, authLoading, role]);

  const updateApprovalStatus = async (eventId: string, nextStatus: 'accepted' | 'rejected') => {
    try {
      await axios.patch(
        `/api/events/${eventId}/approval`,
        { status: nextStatus },
        { withCredentials: true }
      );

      if (approvalTab === 'pending') {
        setPendingApprovals((prev) => prev.filter((e) => e._id !== eventId));
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Failed to update approval status');
    }
  };

  const handleFestCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return alert('Please select a date');

    setLoading(true);
    try {
      const startDateTime = new Date(selectedDate);
      const [startH, startM] = startTime.split(':').map(Number);
      startDateTime.setHours(startH, startM);

      const endDateTime = new Date(selectedDate);
      const [endH, endM] = endTime.split(':').map(Number);
      endDateTime.setHours(endH, endM);

      if (startDateTime <= new Date()) {
        alert('Event must be scheduled in the future');
        setLoading(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        alert('End time must be after start time');
        return;
      }

      await axios.post(
        '/api/events',
        {
          title,
          description,
          image,
          location,
          category,
          startTime: startDateTime,
          endTime: endDateTime,
        },
        { withCredentials: true }
      );

      // Reset form
      setTitle('');
      setDescription('');
      setImage('');
      setLocation('');
      setCategory('');
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedDate(new Date());
      setApprovalTab('approved');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleEdit = (event: Event) => {
    setEditingEventId(event._id);
    setTitle(event.title);
    setDescription(event.description);
    setImage(event.image);
    setLocation(event.location);
    setCategory(event.category);
    
    const start = new Date(event.startTime);
    setSelectedDate(start);
    setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
    
    if (event.endTime) {
      const end = new Date(event.endTime);
      setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
    }
    
    setView('edit');
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/events/${eventId}`, { withCredentials: true });
      setEvents(events.filter(e => e._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

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

      // Future date validation
      if (startDateTime <= new Date()) {
        alert('Event must be scheduled in the future');
        setLoading(false);
        return;
      }

      // Basic validation
      if (endDateTime <= startDateTime) {
        alert('End time must be after start time');
        return;
      }

      if (view === 'create') {
        await axios.post('/api/events', {
          title,
          description,
          image,
          location,
          category,
          startTime: startDateTime, 
          endTime: endDateTime
        }, { withCredentials: true });
      } else {
        await axios.patch(`/api/events/${editingEventId}`, {
          title,
          description,
          image,
          location,
          category,
          startTime: startDateTime, 
          endTime: endDateTime
        }, { withCredentials: true });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setImage('');
      setLocation('');
      setCategory('');
      setStartTime('09:00');
      setEndTime('17:00');
      setEditingEventId(null);
      
      setView('list');
    } catch (error) {
      console.error(`Error ${view === 'create' ? 'creating' : 'updating'} event:`, error);
      alert(`Failed to ${view === 'create' ? 'create' : 'update'} event`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12">
      {authLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={32} className="animate-spin text-dark-accent" />
        </div>
      ) : role === 'Fest Organizing Body' ? (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Fest Organizing Body
              </h1>
              <p className="text-dark-muted mt-1">Moderate submissions, publish official events, and manage organizer access</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setApprovalTab('pending')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                approvalTab === 'pending'
                  ? 'bg-dark-accent text-white'
                  : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setApprovalTab('approved')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                approvalTab === 'approved'
                  ? 'bg-dark-accent text-white'
                  : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white'
              }`}
            >
              Approved Events
            </button>
            <button
              onClick={() => setApprovalTab('create')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                approvalTab === 'create'
                  ? 'bg-dark-accent text-white'
                  : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white'
              }`}
            >
              Create Events
            </button>
            <button
              onClick={() => setApprovalTab('promote')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                approvalTab === 'promote'
                  ? 'bg-dark-accent text-white'
                  : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white'
              }`}
            >
              Promote Managers
            </button>
            {/*Fest Analytics Button */}
            <button
              onClick={() => setApprovalTab('analytics')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                approvalTab === 'analytics'
                  ? 'bg-dark-accent text-white'
                  : 'bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white'
              }`}
            >
              Fest Analytics
            </button>
          </div>
          {approvalTab === 'create' ? (
            <div className="max-w-3xl mx-auto">
              <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Add Event (Auto-Approved)</h2>
                <p className="text-dark-muted mb-6 text-sm">
                  Events created by the Fest Organizing Body are immediately set to <span className="text-white">accepted</span>.
                </p>

                <form onSubmit={handleFestCreate} className="space-y-8">
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

                      <CustomSelect
                        label="Location"
                        value={location}
                        onChange={setLocation}
                        options={venueOptions}
                        placeholder="Select a venue"
                        icon={<MapPin size={18} />}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar size={18} className="text-dark-accent" />
                      Date & Time
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <CustomDatePicker label="Date" value={selectedDate} onChange={setSelectedDate} minDate={new Date()} />
                      <CustomTimePicker label="Start Time" value={startTime} onChange={setStartTime} />
                      <CustomTimePicker label="End Time" value={endTime} onChange={setEndTime} />
                    </div>
                  </div>

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
                      onClick={() => setApprovalTab('approved')}
                      className="px-6 py-3 rounded-xl text-dark-muted hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-dark-accent hover:bg-dark-accent-light text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : approvalTab === 'promote' ? (
            <div className="max-w-3xl mx-auto">
              <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Promote User to Event Manager</h2>
                <p className="text-dark-muted mb-6 text-sm">
                  Enter a user&apos;s email. If they exist, their role becomes <span className="text-white">Event Manager</span>.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = promoteEmail.trim();
                    if (!email) return alert('Please enter an email.');

                    setPromoteLoading(true);
                    setPromoteMessage(null);
                    try {
                      const { data } = await axios.post(
                        '/api/users/promote-event-manager',
                        { email },
                        { withCredentials: true }
                      );
                      setPromoteMessage(data?.message || 'Promotion successful.');
                      setPromoteEmail('');
                    } catch (error: unknown) {
                      let msg = 'Failed to promote user.';
                      if (error && typeof error === 'object' && 'response' in error) {
                        const axiosError = error as { response?: { data?: { message?: string } } };
                        msg = axiosError.response?.data?.message || msg;
                      }
                      setPromoteMessage(msg);
                    } finally {
                      setPromoteLoading(false);
                    }
                  }}
                  className="space-y-8"
                >
                  <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">User Email</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent/50 focus:ring-1 focus:ring-dark-accent/50 transition-colors placeholder:text-dark-muted/50"
                      placeholder="user@example.com"
                      value={promoteEmail}
                      onChange={(e) => setPromoteEmail(e.target.value)}
                    />
                    {promoteMessage && (
                      <p
                        className={`mt-3 text-sm ${
                          promoteMessage.toLowerCase().includes('fail') ? 'text-red-300' : 'text-green-300'
                        }`}
                      >
                        {promoteMessage}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPromoteEmail('');
                        setPromoteMessage(null);
                      }}
                      className="px-6 py-3 rounded-xl text-dark-muted hover:text-white font-medium transition-colors cursor-pointer"
                      disabled={promoteLoading}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={promoteLoading}
                      className="bg-dark-accent hover:bg-dark-accent-light text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {promoteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Promote'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : approvalTab === 'analytics' ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {analyticsLoading || !festAnalytics ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 size={32} className="animate-spin text-dark-accent" />
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FestStatCard icon={Users} label="Unique Users" value={festAnalytics.totalUniqueInterested} sub="Across all events" color="#6C5DD3" delay={0.1} />
                    <FestStatCard icon={Calendar} label="Total Events" value={festAnalytics.totalEvents} sub="Accepted events" color="#3B82F6" delay={0.15} />
                    <FestStatCard icon={MessageCircle} label="Chat Messages" value={festAnalytics.totalChatMessages} sub="Total discussions" color="#10B981" delay={0.2} />
                    <FestStatCard icon={TrendingUp} label="Avg Interest" value={festAnalytics.avgInterestPerEvent} sub="Per event" color="#F59E0B" delay={0.25} />
                  </div>

                  {/* Row 2: Top Events + Category Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <FestSectionCard title="Top Performing Events" delay={0.3} className="lg:col-span-3">
                      {festAnalytics.topEvents.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={festAnalytics.topEvents} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <YAxis
                              type="category" dataKey="title" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} width={130}
                              tick={({ x, y, payload }: any) => (
                                <text x={x} y={y} dy={4} textAnchor="end" fill="#8888A0" fontSize={11}>
                                  {payload.value.length > 18 ? payload.value.slice(0, 18) + '…' : payload.value}
                                </text>
                              )}
                            />
                            <Tooltip {...FEST_TOOLTIP} />
                            <Bar dataKey="interestedCount" name="Interested" fill="#6C5DD3" radius={[0, 4, 4, 0]} barSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-dark-muted text-sm">No data yet</div>
                      )}
                    </FestSectionCard>

                    <FestSectionCard title="Category Distribution" delay={0.35} className="lg:col-span-2">
                      {festAnalytics.categoryDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={festAnalytics.categoryDistribution}
                              cx="50%" cy="50%"
                              innerRadius={55} outerRadius={95}
                              paddingAngle={3}
                              dataKey="count" nameKey="category"
                              stroke="none"
                            >
                              {festAnalytics.categoryDistribution.map((_: any, index: number) => (
                                <Cell key={index} fill={FEST_PIE_COLORS[index % FEST_PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip {...FEST_TOOLTIP} />
                            <Legend
                              verticalAlign="bottom" iconType="circle" iconSize={8}
                              formatter={(value: string) => <span style={{ color: '#8888A0', fontSize: '12px' }}>{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-dark-muted text-sm">No data yet</div>
                      )}
                    </FestSectionCard>
                  </div>

                  {/* Row 3: Interest Trend + Batch Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <FestSectionCard title="Interest Trend" delay={0.4} className="lg:col-span-3">
                      {festAnalytics.interestTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={festAnalytics.interestTrend}>
                            <defs>
                              <linearGradient id="festTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6C5DD3" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#6C5DD3" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="date" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false}
                              tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                              {...FEST_TOOLTIP}
                              labelFormatter={(d: any) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6C5DD3" fill="url(#festTrendGrad)" strokeWidth={2} name="New Interests" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-dark-muted text-sm">No data yet</div>
                      )}
                    </FestSectionCard>

                    <FestSectionCard title="Batch Breakdown" delay={0.45} className="lg:col-span-2">
                      {Object.keys(festAnalytics.overallBatchBreakdown).length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={Object.entries(festAnalytics.overallBatchBreakdown).map(([name, value]) => ({ name, value }))}
                              cx="50%" cy="50%"
                              innerRadius={50} outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {Object.entries(festAnalytics.overallBatchBreakdown).map((_: any, index: number) => (
                                <Cell key={index} fill={FEST_PIE_COLORS[index % FEST_PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip {...FEST_TOOLTIP} />
                            <Legend
                              verticalAlign="bottom" iconType="circle" iconSize={8}
                              formatter={(value: string) => <span style={{ color: '#8888A0', fontSize: '12px' }}>{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-dark-muted text-sm">No batch data</div>
                      )}
                    </FestSectionCard>
                  </div>

                  {/* Row 4: Events Timeline + Venue Popularity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FestSectionCard title="Events Timeline" delay={0.5}>
                      {festAnalytics.eventsTimeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={festAnalytics.eventsTimeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="date" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false}
                              tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                              {...FEST_TOOLTIP}
                              labelFormatter={(d: any) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Events" barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-dark-muted text-sm">No data yet</div>
                      )}
                    </FestSectionCard>

                    <FestSectionCard title="Venue Popularity" delay={0.55}>
                      {festAnalytics.venuePopularity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={festAnalytics.venuePopularity} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <YAxis
                              type="category" dataKey="venue" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} width={120}
                              tick={({ x, y, payload }: any) => (
                                <text x={x} y={y} dy={4} textAnchor="end" fill="#8888A0" fontSize={11}>
                                  {payload.value.length > 16 ? payload.value.slice(0, 16) + '…' : payload.value}
                                </text>
                              )}
                            />
                            <Tooltip {...FEST_TOOLTIP} />
                            <Bar dataKey="interestedCount" name="Interested" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-dark-muted text-sm">No data yet</div>
                      )}
                    </FestSectionCard>
                  </div>
                </>
              )}
            </div>
          ) : approvalsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 size={32} className="animate-spin text-dark-accent" />
            </div>
          ) : approvalTab === 'pending' ? (
            pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-dark-muted border border-dashed border-white/10 rounded-3xl bg-white/5">
                <Calendar size={48} className="mb-4 opacity-20" />
                <h3 className="text-xl font-semibold text-white mb-2">No pending approvals</h3>
                <p className="mb-6 max-w-sm">Submitted events will appear here until they are approved or rejected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((event) => (
                  <div
                    key={event._id}
                    className="glass-card rounded-2xl border border-white/5 hover:border-dark-accent/30 transition-all overflow-hidden"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 justify-between">
                          <h3 className="text-lg font-bold text-white line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90">
                            Pending
                          </div>
                        </div>
                        <p className="text-dark-muted text-sm mt-1 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-dark-muted">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-dark-accent" />
                            <span>{formatDate(event.startTime)} • {formatTime(event.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-dark-accent" />
                            <span>Ends: {formatTime(event.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-dark-accent" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                        <p className="text-xs text-dark-muted mt-2">
                          Organizer: {event.organizer?.name || 'Unknown'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => updateApprovalStatus(event._id, 'accepted')}
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateApprovalStatus(event._id, 'rejected')}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            approvedEvents.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-dark-muted text-lg">No approved events found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedEvents.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
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
                      showAnalyticsButton={true}
                    />
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Manager Dashboard
              </h1>
              <p className="text-dark-muted mt-1">Manage your events and listings</p>
            </div>

            {view === 'list' && role === 'Event Manager' && (
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
            {(view === 'create' || view === 'edit') ? (
              <motion.div
                key="form"
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
                  <h2 className="text-2xl font-bold mb-8">{view === 'create' ? 'Create New Event' : 'Edit Event'}</h2>

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

                        <CustomSelect
                          label="Location"
                          value={location}
                          onChange={setLocation}
                          options={venueOptions}
                          placeholder="Select a venue"
                          icon={<MapPin size={18} />}
                        />
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
                          minDate={new Date()}
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
                        {loading ? (view === 'create' ? 'Creating...' : 'Updating...') : (view === 'create' ? 'Submit for Approval' : 'Update Event')}
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
                          <div className="absolute top-4 right-4 flex gap-2">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                              {event.category}
                            </div>
                            {event.status && (
                              <div className="bg-dark-accent/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-dark-accent/30 text-white/90">
                                {event.status}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button
                              onClick={() => handleEdit(event)}
                              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110 cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="p-3 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-red-400 transition-all transform hover:scale-110 cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 size={20} />
                            </button>
                            <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/message-page?eventId=${event._id}`);
                                  }}
                              className="p-3 bg-yellow-500/20 hover:bg-yellow-500/40 backdrop-blur-md rounded-full text-yellow-400 transition-all transform hover:scale-110 cursor-pointer"
                              title="Send Message"
                            >
                              <Send size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          {/* Analytics Button and Title Container */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white line-clamp-1">{event.title}</h3>
                            <Link
                              to={`/events/${event._id}/analytics`}
                              className="bg-dark-accent hover:bg-dark-accent-light text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shrink-0 border border-white/10"
                            >
                              Analytics
                            </Link>
                          </div>
                          
                          <p className="text-dark-muted text-sm line-clamp-2 mb-4 flex-1">{event.description}</p>

                          <div className="flex flex-col gap-2 text-sm text-dark-muted border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-dark-accent" />
                              <span>
                                {new Date(event.startTime).toLocaleDateString()}
                                <span className="mx-1">•</span>
                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {event.endTime && (
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-dark-accent" />
                                <span>
                                  Ends: {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      )}
    </div>
  );
};

export default ManagerDashboard;
