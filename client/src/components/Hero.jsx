import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">

      {/* Glow 1 */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl top-[-100px] left-[-100px]" />

      {/* Glow 2 */}
      <div className="absolute w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 text-center px-6">

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-7xl md:text-8xl font-black"
        >
          Build The Next
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Unicorn
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-xl text-gray-300 max-w-3xl mx-auto"
        >
          Connect with founders, developers, designers,
          and startup dreamers worldwide.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex gap-4 justify-center"
        >
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 font-bold hover:scale-105 transition">
            Start Building
          </button>

          <button className="px-8 py-4 rounded-xl border border-gray-600 backdrop-blur-md">
            Watch Demo
          </button>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;