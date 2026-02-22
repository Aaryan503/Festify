import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomTimePickerProps {
  label: string;
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
}

const CustomTimePicker = ({ label, value, onChange }: CustomTimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial time
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (value) {
        const [h, m] = value.split(':');
        let hourInt = parseInt(h);
        const p = hourInt >= 12 ? 'PM' : 'AM';
        
        if (hourInt > 12) hourInt -= 12;
        if (hourInt === 0) hourInt = 12;

        setHours(hourInt.toString().padStart(2, '0'));
        setMinutes(m);
        setPeriod(p);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeChange = (newH: string, newM: string, newP: 'AM' | 'PM') => {
    setHours(newH);
    setMinutes(newM);
    setPeriod(newP);

    // Convert back to 24h for storage
    let hInt = parseInt(newH);
    if (newP === 'PM' && hInt < 12) hInt += 12;
    if (newP === 'AM' && hInt === 12) hInt = 0;

    onChange(`${hInt.toString().padStart(2, '0')}:${newM}`);
  };



  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45']; 

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-dark-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border ${isOpen ? 'border-dark-accent/50 ring-1 ring-dark-accent/50' : 'border-white/10'} rounded-xl px-4 py-3 text-left text-white focus:outline-none transition-all flex items-center justify-between group hover:border-white/20`}
      >
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-dark-muted group-hover:text-white transition-colors" />
          <span className="text-white font-medium tracking-wide">
            {hours}:{minutes} {period}
          </span>
        </div>
        <ChevronDown size={16} className={`text-dark-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-xl p-4 flex gap-2 backdrop-blur-xl justify-center min-w-[200px]"
          >
            {/* Hours Column */}
            <div className="flex flex-col h-32 overflow-y-auto w-16 scrollbar-hide snap-y">
                {hourOptions.map(h => (
                    <button
                        key={h}
                        type="button"
                        onClick={() => handleTimeChange(h, minutes, period)}
                        className={`py-1 rounded snap-center hover:bg-white/10 ${hours === h ? 'text-dark-accent font-bold bg-white/5' : 'text-dark-muted'}`}
                    >
                        {h}
                    </button>
                ))}
            </div>
            
            <div className="text-white font-bold py-1 px-1">:</div>

            {/* Minutes Column */}
            <div className="flex flex-col h-32 overflow-y-auto w-16 scrollbar-hide snap-y">
                {minuteOptions.map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeChange(hours, m, period)}
                        className={`py-1 rounded snap-center hover:bg-white/10 ${minutes === m ? 'text-dark-accent font-bold bg-white/5' : 'text-dark-muted'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
            
            {/* AM/PM Column */}
             <div className="flex flex-col h-32 justify-center gap-2 w-16">
                {(['AM', 'PM'] as const).map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => handleTimeChange(hours, minutes, p)}
                        className={`py-1 rounded hover:bg-white/10 ${period === p ? 'text-dark-accent font-bold bg-white/5' : 'text-dark-muted'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomTimePicker;
