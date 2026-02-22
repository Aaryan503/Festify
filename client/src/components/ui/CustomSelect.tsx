import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  id: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
}

const CustomSelect = ({ label, value, onChange, options, placeholder = "Select an option", icon }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-dark-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border ${isOpen ? 'border-dark-accent/50 ring-1 ring-dark-accent/50' : 'border-white/10'} rounded-xl px-4 py-3 text-left text-white focus:outline-none transition-all flex items-center justify-between group hover:border-white/20`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && <span className="text-dark-muted group-hover:text-white transition-colors">{icon}</span>}
          <span className={`truncate ${!selectedOption ? 'text-dark-muted' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
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
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] w-full mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl max-h-60 overflow-y-auto"
          >
            <div className="p-1">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    value === option.id 
                      ? 'bg-dark-accent text-white font-medium' 
                      : 'text-dark-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {option.label}
                  {value === option.id && (
                    <motion.div layoutId="check" className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
