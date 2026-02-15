import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Dummy data ── */
const SPOTLIGHT = {
  title: 'Band Night: Pineapple Express',
  timeLeft: '50 MINUTES',
  image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

const OTHER_EVENTS = [
  {
    id: 1,
    title: 'PCRC Concert',
    date: '5TH NOVEMBER',
    time: '8:00 PM',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    title: 'Comedy Night',
    date: '4TH NOVEMBER',
    time: '8:00 PM',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=400',
  },
];

const HomePage = () => {
  return (
    <div className="p-5">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          PEARL{' '}
          <span className="text-[10px] text-dark-muted align-center leading-none inline-block">
            20<br />26
          </span>
        </h1>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <MoreVertical size={20} className="text-dark-muted" />
        </button>
      </div>

      <p className="text-dark-accent-light text-[11px] font-semibold uppercase tracking-widest mb-1">
        Starting in {SPOTLIGHT.timeLeft}
      </p>
      <h2 className="text-lg font-bold mb-4">{SPOTLIGHT.title}</h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-3xl overflow-hidden mb-8 group"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={SPOTLIGHT.image}
            alt={SPOTLIGHT.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent to-transparent" />
          
          {/* Radial glow overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,93,211,0.15),transparent_70%)]" />
        </div>
      </motion.div>

      <h3 className="text-base font-bold mb-4">Other Events:</h3>
      <div className="grid grid-cols-2 gap-3">
        {OTHER_EVENTS.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
            className="glass rounded-2xl overflow-hidden group cursor-pointer"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                <h4 className="font-bold text-sm leading-tight">{event.title}</h4>
                <p className="text-[10px] text-white/50 uppercase mt-0.5">
                  {event.date}, {event.time}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
