import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Users, MessageCircle, TrendingUp, Calendar, MapPin, Tag, User, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend
} from 'recharts';

const API = import.meta.env.VITE_API_URL;

// ─── Color palettes ───
const PIE_COLORS = ['#6C5DD3', '#8B7FE8', '#A78BFA', '#C4B5FD', '#7C3AED', '#5B21B6', '#4C1D95', '#DDD6FE'];
const ACCENT = '#6C5DD3';
const ACCENT_LIGHT = '#8B7FE8';

// Chart tooltip style matching dark theme
const tooltipStyle = {
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

interface AnalyticsData {
  eventDetails: {
    title: string;
    category: string;
    location: string;
    startTime: string;
    endTime: string;
    organizer: string;
  };
  totalInterested: number;
  chatMessageCount: number;
  engagementRate: number;
  yearBreakdown: Record<string, number>;
  interestTimeline: { date: string; count: number; cumulative: number }[];
  chatTimeline: { date: string; count: number }[];
  chatHourlyActivity: { hour: number; count: number }[];
  categoryComparison: { title: string; interestedCount: number; isCurrentEvent: boolean }[];
  venueComparison: { title: string; interestedCount: number; isCurrentEvent: boolean }[];
}

// ─── Stat card ───
const StatCard = ({ icon: Icon, label, value, sub, color, delay }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col gap-3"
    style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(16px)' }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <span className="text-dark-muted text-sm font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}99)` }}>
      {value}
    </p>
    {sub && <p className="text-xs text-dark-muted">{sub}</p>}
  </motion.div>
);

// ─── Section card ───
const SectionCard = ({ title, children, delay = 0, className = '' }: {
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

// Custom bar for comparison charts - highlight current event
interface ComparisonBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { isCurrentEvent?: boolean };
}

const ComparisonBar = (props: ComparisonBarProps) => {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const isCurrentEvent = payload?.isCurrentEvent;
  return (
    <rect
      x={x} y={y} width={width} height={height} rx={4}
      fill={isCurrentEvent ? '#6C5DD3' : 'rgba(139,127,232,0.35)'}
      stroke={isCurrentEvent ? '#8B7FE8' : 'transparent'}
      strokeWidth={isCurrentEvent ? 2 : 0}
    />
  );
};

export default function EventAnalyticsPage() {
  const { eventId } = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get<AnalyticsData>(`${API}/api/events/${eventId}/analytics`, {
          withCredentials: true,
        });
        setData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-dark-accent border-t-transparent animate-spin" />
          <p className="text-dark-muted text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
          <p className="text-red-400 text-lg font-medium">Error: {error}</p>
          <Link to="/manager" className="text-dark-accent hover:text-dark-accent-light mt-4 inline-block text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare pie data
  const pieData = Object.entries(data.yearBreakdown).map(([name, value]) => ({ name, value }));

  // Format date labels
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/manager" className="inline-flex items-center gap-2 text-dark-muted hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {data.eventDetails.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-dark-muted">
                <span className="flex items-center gap-1.5"><Tag size={14} className="text-dark-accent" />{data.eventDetails.category}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-dark-accent" />{data.eventDetails.location}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-dark-accent" />{new Date(data.eventDetails.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><User size={14} className="text-dark-accent" />{data.eventDetails.organizer}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Users} label="Total Interested" value={data.totalInterested} sub="People marked interested" color="#6C5DD3" delay={0.1} />
          <StatCard icon={MessageCircle} label="Chat Messages" value={data.chatMessageCount} sub="In event discussion" color="#3B82F6" delay={0.15} />
          <StatCard icon={TrendingUp} label="Engagement Rate" value={`${data.engagementRate}%`} sub="Of all platform users" color="#10B981" delay={0.2} />
        </div>

        {/* Row 2: Pie Chart + Interest Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* Batch Breakdown Pie */}
          <SectionCard title="Batch Breakdown" delay={0.25} className="lg:col-span-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span style={{ color: '#8888A0', fontSize: '12px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-dark-muted text-sm">No batch data available</div>
            )}
          </SectionCard>

          {/* Interest Over Time */}
          <SectionCard title="Interest Over Time" delay={0.3} className="lg:col-span-3">
            {data.interestTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.interestTimeline}>
                  <defs>
                    <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} labelFormatter={(label: string | number) => formatDateLabel(String(label))} />
                  <Area type="monotone" dataKey="cumulative" stroke={ACCENT} fill="url(#interestGrad)" strokeWidth={2} name="Total Interested" dot={false} />
                  <Area type="monotone" dataKey="count" stroke={ACCENT_LIGHT} fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="New per Day" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-dark-muted text-sm">No timeline data yet</div>
            )}
          </SectionCard>
        </div>

        {/* Row 3: Chat Activity + Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SectionCard title="Chat Activity" delay={0.35}>
            {data.chatTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.chatTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} labelFormatter={(label: string | number) => formatDateLabel(String(label))} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Messages" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-dark-muted text-sm">No chat activity yet</div>
            )}
          </SectionCard>

          <SectionCard title="Peak Chat Hours" delay={0.4}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.chatHourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHourLabel} stroke="#8888A0" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  {...tooltipStyle}
                  labelFormatter={(h: string | number) => formatHourLabel(Number(h))}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="Messages" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Row 4: Category & Venue Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SectionCard title={`vs. Other "${data.eventDetails.category}" Events`} delay={0.45}>
            {data.categoryComparison.length > 1 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, data.categoryComparison.length * 40)}>
                <BarChart data={data.categoryComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="title" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} width={120}
                    tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                      const item = data.categoryComparison.find(c => c.title === payload.value);
                      return (
                        <text x={x} y={y} dy={4} textAnchor="end" fill={item?.isCurrentEvent ? '#6C5DD3' : '#8888A0'} fontSize={11} fontWeight={item?.isCurrentEvent ? 700 : 400}>
                          {payload.value.length > 16 ? payload.value.slice(0, 16) + '…' : payload.value}
                        </text>
                      );
                    }}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="interestedCount" name="Interested" shape={<ComparisonBar />} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-dark-muted text-sm">No other events in this category</div>
            )}
          </SectionCard>

          <SectionCard title={`vs. Other Events at "${data.eventDetails.location}"`} delay={0.5}>
            {data.venueComparison.length > 1 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, data.venueComparison.length * 40)}>
                <BarChart data={data.venueComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="title" stroke="#8888A0" fontSize={11} tickLine={false} axisLine={false} width={120}
                    tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                      const item = data.venueComparison.find(c => c.title === payload.value);
                      return (
                        <text x={x} y={y} dy={4} textAnchor="end" fill={item?.isCurrentEvent ? '#6C5DD3' : '#8888A0'} fontSize={11} fontWeight={item?.isCurrentEvent ? 700 : 400}>
                          {payload.value.length > 16 ? payload.value.slice(0, 16) + '…' : payload.value}
                        </text>
                      );
                    }}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="interestedCount" name="Interested" shape={<ComparisonBar />} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-dark-muted text-sm">No other events at this venue</div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
