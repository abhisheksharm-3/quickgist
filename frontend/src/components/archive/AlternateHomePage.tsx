import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Shield,
  Network,
  FileCode2,
  ChevronRight,
  Upload,
  FileUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Link } from "react-router-dom";
import Layout from "../Layout";

const HomePage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:24px_24px]" />
        </div>

        {/* Simplified animated gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-full blur-3xl"
            animate={{
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <UpdateBanner />
          <HeroSection />
          <FeaturesSection />
        </div>
      </div>
    </Layout>
  );
};

const UpdateBanner = () => (
  <motion.div
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="mb-12"
  >
    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 flex items-center justify-center gap-3">
      <div className="text-blue-400">
        <FileUp className="h-5 w-5" />
      </div>
      <p className="text-zinc-300">
        <span className="font-medium">New:</span> Enhanced file sharing capabilities now available
      </p>
    </div>
  </motion.div>
);

const HeroSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="text-center mb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div
          className="inline-block mb-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.h1
            className="text-6xl md:text-7xl font-bold tracking-tight
                     text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400"
            animate={{
              textShadow: isHovered 
                ? "0 0 40px rgba(96,165,250,0.4)" 
                : "0 0 20px rgba(96,165,250,0.2)",
            }}
          >
            QuickGist
          </motion.h1>
        </div>

        <motion.h2
          className="text-2xl md:text-3xl font-medium mb-6 text-zinc-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Simple, secure file sharing
        </motion.h2>

        <motion.p
          className="text-lg mb-10 max-w-2xl mx-auto text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Share any file type instantly with our streamlined sharing system.
          Fast uploads, broad compatibility, and robust security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 text-lg font-medium
                     rounded-lg transition-all duration-200 group"
            asChild
          >
            <Link to="/create" className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <span>Start sharing</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = useMemo(
    () => [
      {
        icon: <Rocket className="h-6 w-6" />,
        title: "Fast Uploads",
        description: "Quick and efficient file transfer system.",
        color: "text-blue-400",
        borderColor: "border-blue-400/20",
        bgColor: "bg-blue-400/10"
      },
      {
        icon: <Shield className="h-6 w-6" />,
        title: "Secure Systems",
        description: "End-to-end encryption for your files.",
        color: "text-violet-400",
        borderColor: "border-violet-400/20",
        bgColor: "bg-violet-400/10"
      },
      {
        icon: <Network className="h-6 w-6" />,
        title: "Global Network",
        description: "Fast access from anywhere.",
        color: "text-cyan-400",
        borderColor: "border-cyan-400/20",
        bgColor: "bg-cyan-400/10"
      },
      {
        icon: <FileCode2 className="h-6 w-6" />,
        title: "File Support",
        description: "Compatible with all common file types.",
        color: "text-emerald-400",
        borderColor: "border-emerald-400/20",
        bgColor: "bg-emerald-400/10"
      },
    ],
    []
  );

  return (
    <motion.section
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} index={index} />
      ))}
    </motion.section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  index: number;
}

const FeatureCard = ({
  icon,
  title,
  description,
  color,
  borderColor,
  bgColor,
  index
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={`border ${borderColor} bg-zinc-900/50 backdrop-blur-sm p-6
                  hover:scale-[1.02] transition-transform duration-200`}
      >
        <div className="flex flex-col h-full">
          <div className={`mb-4 ${color} ${bgColor} p-3 rounded-lg w-fit`}>
            {icon}
          </div>
          <h3 className="text-xl font-medium mb-2 text-zinc-200">
            {title}
          </h3>
          <p className="text-zinc-400">{description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default HomePage;