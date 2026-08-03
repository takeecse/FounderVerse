import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaChartLine,
  FaHandshake,
  FaLayerGroup,
  FaRocket,
  FaUsers,
} from "react-icons/fa6";
import Hero3D from "./Hero3D";
import { isAuthenticated } from "../utils/session";

const signals = [
  {
    icon: <FaUsers />,
    value: "Founder-first",
    label: "profiles, skills, and startup intent",
  },
  {
    icon: <FaHandshake />,
    value: "Collaboration",
    label: "requests, connections, and chat",
  },
  {
    icon: <FaChartLine />,
    value: "Momentum",
    label: "startup execution dashboards",
  },
];

function Hero() {
  const startTarget = isAuthenticated()
    ? "/dashboard"
    : "/register";

  return (
    <>
      <section className="relative min-h-[calc(100vh-92px)] overflow-hidden">
        <div className="absolute inset-0 opacity-90">
          <Hero3D />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98),rgba(0,0,0,0.82)_40%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.72))]" />

        <div className="page-shell page-wide relative z-10 flex min-h-[calc(100vh-92px)] items-center pb-28 pt-14">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="eyebrow"
            >
              Startup networking and collaboration
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7 }}
              className="max-w-4xl text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.88] tracking-normal"
            >
              Founder<span className="text-gradient">Verse</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-300"
            >
              Match with founders, build trusted teams, share startup
              opportunities, and turn early ideas into serious collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link
                to={startTarget}
                className="btn btn-primary"
              >
                <FaRocket />
                Start Building
                <FaArrowRight />
              </Link>
              <Link
                to="/startups"
                className="btn btn-secondary"
              >
                <FaLayerGroup />
                Explore Startups
              </Link>
              <Link
                to="/founders"
                className="btn btn-secondary"
              >
                <FaUsers />
                Meet Founders
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="page-shell page-wide -mt-24 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {signals.map((signal) => (
            <div
              key={signal.value}
              className="glass-card p-6"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                {signal.icon}
              </div>
              <h2 className="text-2xl font-black">
                {signal.value}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {signal.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Hero;
