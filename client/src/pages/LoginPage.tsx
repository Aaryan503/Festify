import { motion } from 'framer-motion';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#0B0B14] via-[#151528] to-[#1A1A3E]">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/25 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-32 left-10 w-64 h-64 bg-blue-700/15 rounded-full blur-3xl animate-blob animation-delay-4000" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-dark-accent/30 via-indigo-600/15 to-transparent blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center"
        >
          <h1 className="text-7xl font-black tracking-tight leading-none mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-dark-muted/60">
              Festify
            </span>
          </h1>
          <p className="text-dark-muted text-sm font-medium tracking-widest uppercase">
            easy way to all your fest needs
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 px-8 pb-12"
      >
        <button
          onClick={handleGoogleLogin}
          className="w-full glass-strong py-4 px-6 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
            alt="Google"
          />
          <span className="font-semibold text-base">Sign in with Google</span>
        </button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full text-indigo-950/60 fill-current">
          <path d="M0,160L60,176C120,192,240,224,360,224C480,224,600,192,720,165C840,139,960,117,1080,128C1200,139,1320,181,1380,197L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full text-purple-950/50 fill-current">
          <path d="M0,256L60,240C120,224,240,192,360,186.7C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
      </div>
    </div>
  );
};

export default LoginPage;
