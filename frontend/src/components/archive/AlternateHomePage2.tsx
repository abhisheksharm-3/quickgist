import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Shield,
  Network,
  FileCode2,
  ChevronRight,
  Sparkles,
  Upload,
  FileUp,
  Star
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Link } from "react-router-dom";
import Layout from "../Layout";

const HomePage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Enhanced grid background with glow */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
            {Array.from({ length: 64 }).map((_, i) => (
              <div 
                key={i} 
                className="border border-white/20 backdrop-blur-sm"
              />
            ))}
          </div>
        </div>

        {/* Enhanced animated elements */}
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-500 border-4 border-white rounded-lg"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 border-4 border-white rounded-lg"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.2, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <NewFeatureBadge />
          <HeroSection />
          <FeaturesSection />
        </div>
      </div>
    </Layout>
  );
};

const NewFeatureBadge = () => (
  <motion.div
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="absolute top-8 right-8 z-20"
  >
    <div className="relative">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full border-2 border-white font-black flex items-center gap-2">
        <Star className="h-5 w-5" />
        NEW FEATURE
      </div>
    </div>
  </motion.div>
);

const HeroSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="text-center mb-24 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        {/* Enhanced title with neon effect */}
        <div
          className="relative inline-block mb-6 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black 
                     bg-zinc-900 px-8 py-4 
                     border-4 border-cyan-500 
                     transform -rotate-2 relative z-10
                     text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500
                     shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            animate={{
              rotate: isHovered ? [-2, 2, -2] : -2,
              textShadow: isHovered 
                ? "0 0 20px rgba(0,255,255,0.8)" 
                : "0 0 10px rgba(0,255,255,0.5)",
            }}
            transition={{
              duration: 0.3,
              repeat: isHovered ? Infinity : 0,
            }}
          >
            QuickGist
          </motion.h1>

          <AnimatePresence>
            {isHovered && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-pink-500/50 blur-md transform translate-x-2 translate-y-2"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500/50 blur-md transform -translate-x-2 -translate-y-2"
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* New feature announcement */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-lg">
            <div className="bg-black px-6 py-3 rounded-md flex items-center gap-2 justify-center">
              <FileUp className="h-6 w-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold">New:</span>
              <span className="text-white">Enhanced File Sharing Now Available!</span>
            </div>
          </div>
        </motion.div>

        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-6 
                   bg-gradient-to-r from-pink-500 to-purple-500 inline-block px-6 py-2 
                   transform rotate-1
                   border-4 border-white
                   shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)]
                   text-white"
          whileHover={{
            scale: 1.05,
            rotate: -1,
          }}
        >
          <span className="inline-flex items-center gap-2">
            Next-Gen File & Code Sharing
            <Sparkles className="h-6 w-6" />
          </span>
        </motion.h2>

        <motion.p
          className="text-xl mb-10 max-w-2xl mx-auto 
                    bg-gradient-to-r from-blue-500 to-cyan-500 p-4 
                    border-4 border-white
                    shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]
                    text-white"
          whileHover={{
            scale: 1.02,
            transition: { type: "spring", stiffness: 400 },
          }}
        >
          Share any file type instantly with our new advanced sharing system.
          Lightning-fast uploads, unlimited file types, and enhanced security.
        </motion.p>

        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-400 to-emerald-600 text-white px-8 py-6 text-xl font-black
                     border-4 border-white rounded-none
                     shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)]
                     hover:translate-x-1 hover:translate-y-1
                     hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]
                     transition-all duration-200
                     group relative overflow-hidden"
            asChild
          >
            <Link to="/create" className="flex items-center gap-2">
              <Upload className="h-6 w-6 relative z-10" />
              <span className="relative z-10">START SHARING</span>
              <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = useMemo(
    () => [
      {
        icon: <Rocket className="h-12 w-12 stroke-[3]" />,
        title: "Lightning Fast",
        description: "Upload and share in milliseconds with our new engine.",
        color: "bg-gradient-to-br from-orange-400 to-red-500",
        iconBg: "bg-orange-300",
        rotation: "rotate-2",
        isNew: false
      },
      {
        icon: <Shield className="h-12 w-12 stroke-[3]" />,
        title: "Bank-Grade Security",
        description: "Enhanced end-to-end encryption for your files.",
        color: "bg-gradient-to-br from-purple-400 to-purple-600",
        iconBg: "bg-purple-300",
        rotation: "-rotate-1",
        isNew: false
      },
      {
        icon: <Network className="h-12 w-12 stroke-[3]" />,
        title: "Global CDN",
        description: "Lightning-fast access from anywhere on Earth.",
        color: "bg-gradient-to-br from-blue-400 to-blue-600",
        iconBg: "bg-blue-300",
        rotation: "rotate-1",
        isNew: false
      },
      {
        icon: <FileCode2 className="h-12 w-12 stroke-[3]" />,
        title: "Universal Sharing",
        description: "Now supporting ALL file types.",
        color: "bg-gradient-to-br from-green-400 to-green-600",
        iconBg: "bg-green-300",
        rotation: "-rotate-2",
        isNew: true
      },
    ],
    []
  );

  return (
    <motion.section
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
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
  iconBg: string;
  rotation: string;
  index: number;
  isNew?: boolean;
}

const FeatureCard = ({
  icon,
  title,
  description,
  color,
  iconBg,
  rotation,
  index,
  isNew
}: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`${color} ${rotation} rounded-xl relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isNew && (
        <div className="absolute -top-3 -right-3 z-20">
          <motion.div
            className="bg-yellow-400 text-black px-2 py-1 text-sm font-bold rounded-full border-2 border-white"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            NEW
          </motion.div>
        </div>
      )}
      
      <Card
        className="border-4 border-white p-6 
                  backdrop-blur-sm bg-black/30
                  shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)]
                  hover:translate-x-1 hover:translate-y-1
                  hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]
                  transition-all duration-200
                  relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-white/10"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />
        <div className="flex flex-col h-full relative z-10">
          <motion.div
            className={`mb-4 ${iconBg} p-4 border-4 border-white inline-block w-fit
                      transform -rotate-6`}
            whileHover={{
              rotate: 0,
              scale: 1.1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
          >
            {icon}
          </motion.div>
          <motion.h3
            className="text-2xl font-black mb-2 text-white uppercase"
            animate={{ scale: isHovered ? 1.05 : 1 }}
          >
            {title}
          </motion.h3>
          <p className="text-white/90 text-lg font-medium">{description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default HomePage;