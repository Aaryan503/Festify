import { useState, useEffect, useRef, useMemo } from 'react';

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

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  mode: 'today' | 'all';
}

// Color palette for event blocks - using the app's purple palette
const EVENT_COLORS = [
  { bg: 'rgba(108, 93, 211, 0.35)', border: 'rgba(108, 93, 211, 0.6)' },   // purple
  { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.55)' },    // blue
  { bg: 'rgba(99, 179, 163, 0.3)', border: 'rgba(99, 179, 163, 0.55)' },    // teal
  { bg: 'rgba(139, 127, 232, 0.3)', border: 'rgba(139, 127, 232, 0.55)' },  // light purple
  { bg: 'rgba(167, 139, 250, 0.3)', border: 'rgba(167, 139, 250, 0.55)' },  // violet
];

const HOUR_HEIGHT = 80; // px per hour
const START_HOUR = 8;   // 8 AM
const END_HOUR = 23;    // 11 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getEventPosition(event: Event) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const topMinutes = startMinutes - START_HOUR * 60;
  const durationMinutes = Math.max(endMinutes - startMinutes, 30); // min 30 min for visibility

  return {
    top: (topMinutes / 60) * HOUR_HEIGHT,
    height: (durationMinutes / 60) * HOUR_HEIGHT,
  };
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();

  // Ordinal suffix
  const suffix = (d: number) => {
    if (d > 3 && d < 21) return 'TH';
    switch (d % 10) {
      case 1: return 'ST';
      case 2: return 'ND';
      case 3: return 'RD';
      default: return 'TH';
    }
  };

  return `${day}${suffix(day)} ${month}`;
}

const Calendar = ({ events, onEventClick, mode }: CalendarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const scrollTo = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    events.forEach(event => {
      const key = getDateKey(new Date(event.startTime));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  // Get sorted unique dates
  const sortedDates = useMemo(() => {
    return Object.keys(eventsByDate).sort();
  }, [eventsByDate]);

  const todayKey = getDateKey(currentTime);

  // Today's events
  const todayEvents = eventsByDate[todayKey] || [];

  // Current time position
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentTimeTop = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const currentTimeLabel = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isToday = (dateKey: string) => dateKey === todayKey;

  // Render a single day column
  const renderDayColumn = (dayEvents: Event[], dateKey: string, showTimeLabels: boolean, columnWidth?: string) => {
    const totalHeight = HOURS.length * HOUR_HEIGHT;

    return (
      <div className="relative" style={{ minWidth: columnWidth || '100%' }}>
        <div className="relative" style={{ height: totalHeight }}>
          {/* Hour grid lines */}
          {HOURS.map((hour, i) => (
            <div
              key={hour}
              className="absolute w-full"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {showTimeLabels && (
                <div
                  className="absolute text-xs text-[#8888A0] select-none"
                  style={{
                    left: '-54px',
                    top: '-8px',
                    width: '48px',
                    textAlign: 'right',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {formatHour(hour)}
                </div>
              )}
              <div
                className="w-full"
                style={{
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday(dateKey) && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60 && (
            <div
              className="absolute w-full z-20"
              style={{ top: currentTimeTop }}
            >
              {showTimeLabels && (
                <div
                  className="absolute text-xs font-semibold select-none"
                  style={{
                    left: '-54px',
                    top: '-8px',
                    width: '48px',
                    textAlign: 'right',
                    color: '#ef4444',
                    letterSpacing: '0.02em',
                  }}
                >
                  {currentTimeLabel}
                </div>
              )}
              <div className="relative w-full flex items-center">
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    left: '-4px',
                    top: '-3px',
                  }}
                />
                <div
                  className="w-full"
                  style={{
                    height: '2px',
                    background: 'linear-gradient(90deg, #ef4444 0%, rgba(239, 68, 68, 0.2) 100%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Event blocks */}
          {dayEvents.map((event, idx) => {
            const pos = getEventPosition(event);
            const color = EVENT_COLORS[idx % EVENT_COLORS.length];

            return (
              <div
                key={event._id}
                className="absolute rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
                style={{
                  top: pos.top + 1,
                  height: Math.max(pos.height - 2, 28),
                  left: '4px',
                  right: '4px',
                  background: color.bg,
                  borderLeft: `3px solid ${color.border}`,
                  backdropFilter: 'blur(8px)',
                  zIndex: 10,
                }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="p-2.5 h-full flex flex-col overflow-hidden">
                  <div className="font-semibold text-sm text-white leading-tight truncate">
                    {event.title}
                  </div>
                  {pos.height > 40 && (
                    <div className="text-[11px] text-white/60 mt-0.5 truncate">
                      {event.location}
                    </div>
                  )}
                  {pos.height > 60 && (
                    <div
                      className="mt-auto text-[10px] font-medium tracking-wider uppercase"
                      style={{ color: color.border }}
                    >
                      {event.category}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (mode === 'today') {
    return (
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-2xl"
        style={{
          maxHeight: 'calc(100vh - 260px)',
          background: 'rgba(12, 12, 22, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="relative pl-16 pr-4 py-4">
          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-[#8888A0] text-base font-medium">No events today</p>
              <p className="text-[#8888A0]/60 text-sm mt-1">Check the "All Days" view for upcoming events</p>
            </div>
          ) : (
            renderDayColumn(todayEvents, todayKey, true)
          )}
        </div>
      </div>
    );
  }

  // All days mode - multi-column view
  const datesToShow = sortedDates.length > 0 ? sortedDates : [];

  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-2xl"
      style={{
        maxHeight: 'calc(100vh - 260px)',
        background: 'rgba(12, 12, 22, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {datesToShow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[#8888A0] text-base font-medium">No events scheduled</p>
          <p className="text-[#8888A0]/60 text-sm mt-1">Events will appear here once they are created</p>
        </div>
      ) : (
        <div className="flex">
          {/* Time labels column */}
          <div className="sticky left-0 z-30 flex-shrink-0" style={{ width: '60px', background: 'rgba(12, 12, 22, 0.95)' }}>
            {/* Spacer for date headers */}
            <div
              className="sticky top-0 z-40"
              style={{
                height: '44px',
                background: 'rgba(12, 12, 22, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            />
            <div className="relative py-4" style={{ height: HOURS.length * HOUR_HEIGHT }}>
              {HOURS.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute text-xs text-[#8888A0] select-none"
                  style={{
                    top: i * HOUR_HEIGHT - 8,
                    right: '8px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {datesToShow.map((dateKey) => {
            const dayEvents = eventsByDate[dateKey] || [];
            const isTodayCol = isToday(dateKey);

            return (
              <div
                key={dateKey}
                className="flex-1 flex-shrink-0 relative"
                style={{
                  minWidth: '160px',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {/* Date header - sticky */}
                <div
                  className="sticky top-0 z-30 text-center py-3 text-xs font-bold tracking-widest uppercase select-none"
                  style={{
                    height: '44px',
                    background: isTodayCol
                      ? 'rgba(108, 93, 211, 0.15)'
                      : 'rgba(12, 12, 22, 0.95)',
                    borderBottom: isTodayCol
                      ? '2px solid rgba(108, 93, 211, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isTodayCol ? '#8B7FE8' : '#8888A0',
                  }}
                >
                  {formatDateHeader(dateKey)}
                </div>

                {/* Day content */}
                <div className="relative py-4 px-1">
                  {renderDayColumn(dayEvents, dateKey, false, '100%')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Calendar;
