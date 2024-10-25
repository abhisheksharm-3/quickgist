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
      <div className="relative min-h-screen bg-yellow-50">
        {/* Brutalist pattern background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_21px)]" />
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
    <div className="bg-lime-400 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                    flex items-center justify-center gap-3 transform -rotate-1">
      <div className="bg-white border-4 border-black p-2">
        <FileUp className="h-6 w-6" />
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
            className="text-8xl md:text-9xl font-black tracking-tight bg-white 
                     border-8 border-black px-8 py-4 rotate-2
                     shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
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
          className="text-3xl md:text-4xl font-black mb-6 bg-blue-400 text-black 
                   border-4 border-black p-4 inline-block -rotate-1
                   shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          Simple, secure file sharing
        </motion.h2>

        <motion.p
          initial={{ x: 1000 }}
          animate={{ x: 0 }}
          className="text-xl mb-10 max-w-2xl mx-auto bg-white font-mono
                   border-4 border-black p-6 rotate-1
                   shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          Share any file type instantly with our streamlined sharing system.
          Fast uploads, broad compatibility, and robust security.
        </motion.p>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-block"
        >
          <Button
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white text-xl font-black
                     border-4 border-black px-8 py-8
                     shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-1 hover:translate-y-1
                     hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
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
        title: "Fast Uploads",
        description: "Quick and efficient file transfer system.",
        bgColor: "bg-orange-400",
        rotation: "rotate-2"
      },
      {
        icon: <Shield className="h-8 w-8" />,
        title: "Secure Systems",
        description: "End-to-end encryption for your files.",
        bgColor: "bg-lime-400",
        rotation: "-rotate-1"
      },
      {
        icon: <Network className="h-8 w-8" />,
        title: "Global Network",
        description: "Fast access from anywhere.",
        bgColor: "bg-cyan-400",
        rotation: "rotate-1"
      },
      {
        icon: <FileCode2 className="h-8 w-8" />,
        title: "File Support",
        description: "Compatible with all common file types.",
        bgColor: "bg-purple-400",
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
  rotation: string;
  index: number;
}

const FeatureCard = ({
  icon,
  title,
  description,
  bgColor,
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
        className={`${bgColor} border-4 border-black p-6
                  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                  hover:translate-x-1 hover:translate-y-1
                  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  transition-all duration-200`}
      >
        <div className="flex flex-col h-full">
          <div className="bg-white border-4 border-black p-4 w-fit mb-4">
            {icon}
          </div>
          <h3 className="text-2xl font-black mb-2 font-mono">
            {title}
          </h3>
          <p className="text-lg font-mono">{description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default HomePage;