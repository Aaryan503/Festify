import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
}

const CustomDatePicker = ({ label, value, onChange, placeholder = "Select date" }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // State for navigation
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentDate(value);
    }
  }, [value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // If there was a previously selected date, preserve its time
    if (selectedDate) {
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
    }
    onChange(newDate);
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
        const isSelected = selectedDate && 
            selectedDate.getDate() === i && 
            selectedDate.getMonth() === month && 
            selectedDate.getFullYear() === year;
            
        const isToday = new Date().getDate() === i && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;

        days.push(
            <button
                type="button"
                key={i}
                onClick={() => handleDayClick(i)}
                className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors cursor-pointer 
                    ${isSelected ? 'bg-dark-accent text-white font-bold shadow-lg shadow-dark-accent/30' : 
                      isToday ? 'bg-white/10 text-white font-medium border border-dark-accent' : 
                      'text-dark-muted hover:bg-white/5 hover:text-white'}`}
            >
                {i}
            </button>
        );
    }
    return days;
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-dark-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border ${isOpen ? 'border-dark-accent/50 ring-1 ring-dark-accent/50' : 'border-white/10'} rounded-xl px-4 py-3 text-left text-white focus:outline-none transition-all flex items-center justify-between group hover:border-white/20 cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-dark-muted group-hover:text-white transition-colors" />
          <span className={selectedDate ? 'text-white' : 'text-dark-muted'}>
            {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-[9999] mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-2xl p-4 w-72 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-1 hover:bg-white/5 rounded-lg text-dark-muted hover:text-white transition-colors cursor-pointer">
                    <ChevronLeft size={20} />
                </button>
                <div className="font-semibold text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-white/5 rounded-lg text-dark-muted hover:text-white transition-colors cursor-pointer">
                    <ChevronRight size={20} />
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-dark-muted mb-2">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderCalendar()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; // Added missing closing brace

export default CustomDatePicker;
