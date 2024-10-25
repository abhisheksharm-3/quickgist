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
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

const HomePage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen">
        {/* Brutalist pattern background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#222_20px,#222_21px)]" />
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
    initial={{ x: -1000 }}
    animate={{ x: 0 }}
    className="mb-12"
  >
    <div className="bg-cyan-500 border-4 border-cyan-400 p-4 shadow-[8px_8px_0px_0px_rgba(0,255,255,0.3)] 
                    flex items-center justify-center gap-3 transform -rotate-1">
      <div className="bg-zinc-950 border-4 border-cyan-400 p-2">
        <FileUp className="h-6 w-6 text-cyan-400" />
      </div>
      <p className="text-black font-mono font-bold text-lg">
        NEW UPDATE: Enhanced file sharing just dropped!
      </p>
    </div>
  </motion.div>
);

const HeroSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="text-center mb-24">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="inline-block mb-8 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            className="text-5xl md:text-9xl font-black tracking-tight bg-zinc-950 
                     border-8 border-pink-500 px-8 py-4 rotate-2
                     shadow-[12px_12px_0px_0px_rgba(236,72,153,0.3)]"
            animate={{
              rotate: isHovered ? -2 : 2,
              transition: { duration: 0.3 }
            }}
          >
            <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              QuickGist
            </span>
          </motion.div>
        </div>

        <motion.h2
          initial={{ x: -1000 }}
          animate={{ x: 0 }}
          className="text-3xl md:text-4xl font-black mb-6 bg-zinc-950 text-blue-400 
                   border-4 border-blue-500 p-4 inline-block -rotate-1
                   shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)]"
        >
          Code snippets & file sharing made simple
        </motion.h2>

        <motion.p
          initial={{ x: 1000 }}
          animate={{ x: 0 }}
          className="text-xl mb-10 max-w-2xl mx-auto bg-zinc-950 font-mono text-zinc-300
                   border-4 border-purple-500 p-6 rotate-1
                   shadow-[8px_8px_0px_0px_rgba(168,85,247,0.3)]"
        >
          Share code snippets with syntax highlighting or any type of file instantly.
          Perfect for developers, teams, and anyone who needs to share content quickly.
          No account required.
        </motion.p>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-block"
        >
          <Button
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white text-xl font-black
                     border-4 border-pink-400 px-8 py-8
                     shadow-[8px_8px_0px_0px_rgba(236,72,153,0.3)]
                     hover:translate-x-1 hover:translate-y-1
                     hover:shadow-[4px_4px_0px_0px_rgba(236,72,153,0.3)]
                     transition-all duration-200 group"
            asChild
          >
            <Link to="/create" className="flex items-center gap-3">
              <Upload className="h-6 w-6" />
              <span>START SHARING</span>
              <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
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
        icon: <Rocket className="h-8 w-8" />,
        title: "Fast Servers",
        description: "Powered by Go & distributed edge servers.",
        bgColor: "bg-zinc-950",
        borderColor: "border-orange-500",
        textColor: "text-orange-400",
        shadowColor: "rgba(249,115,22,0.3)",
        rotation: "rotate-2"
      },
      {
        icon: <Shield className="h-8 w-8" />,
        title: "Secure Systems",
        description: "Your data always stays secure.",
        bgColor: "bg-zinc-950",
        borderColor: "border-green-500",
        textColor: "text-green-400",
        shadowColor: "rgba(34,197,94,0.3)",
        rotation: "-rotate-1"
      },
      {
        icon: <Network className="h-8 w-8" />,
        title: "Global Network",
        description: "Fast access from anywhere.",
        bgColor: "bg-zinc-950",
        borderColor: "border-cyan-500",
        textColor: "text-cyan-400",
        shadowColor: "rgba(34,211,238,0.3)",
        rotation: "rotate-1"
      },
      {
        icon: <FileCode2 className="h-8 w-8" />,
        title: "Universal Support",
        description: "Compatible with all common file types.",
        bgColor: "bg-zinc-950",
        borderColor: "border-purple-500",
        textColor: "text-purple-400",
        shadowColor: "rgba(168,85,247,0.3)",
        rotation: "-rotate-2"
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
  bgColor: string;
  borderColor: string;
  textColor: string;
  shadowColor: string;
  rotation: string;
  index: number;
}

const FeatureCard = ({
  icon,
  title,
  description,
  bgColor,
  borderColor,
  textColor,
  shadowColor,
  rotation,
  index
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`${rotation}`}
    >
      <Card
        className={`${bgColor} ${borderColor} border-4 p-6
                  shadow-[8px_8px_0px_0px_${shadowColor}]
                  hover:translate-x-1 hover:translate-y-1
                  hover:shadow-[4px_4px_0px_0px_${shadowColor}]
                  transition-all duration-200`}
      >
        <div className="flex flex-col h-full">
          <div className={`bg-zinc-950 ${borderColor} border-4 p-4 w-fit mb-4`}>
            <div className={textColor}>
              {icon}
            </div>
          </div>
          <h3 className={`text-2xl font-black mb-2 font-mono ${textColor}`}>
            {title}
          </h3>
          <p className="text-lg font-mono text-zinc-400">{description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default HomePage;