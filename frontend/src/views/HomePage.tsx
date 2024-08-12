import React from "react";
import { motion } from "framer-motion";
import {
  RiAddLine,
  RiFileTextLine,
  RiLockLine,
  RiRocketLine,
  RiGlobalLine,
} from "@remixicon/react";
import { Button } from "../components/ui/button";
import { CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { World } from "../components/ui/globe";
import { sampleArcs } from "../lib/globeArcs";
import { StarsBackground } from "../components/ui/stars-background";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HomePage = () => {
  const globeConfig = {
    pointSize: 4,
    globeColor: "#000000",
    showAtmosphere: true,
    atmosphereColor: "#3b82f6",
    atmosphereAltitude: 0.1,
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#3b82f6",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  return (
    <Layout>
      <div className="relative text-white overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-10 opacity-90">
          <World data={sampleArcs} globeConfig={globeConfig} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center mb-12 sm:mb-16"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 sm:mb-6 flex items-center justify-center text-blue-400">
              <RiFileTextLine className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20" />
              QuickGist
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Share text snippets instantly from anywhere in the
              world.
              <span className="block mt-2 sm:mt-4 font-semibold text-blue-300 text-2xl sm:text-3xl">
                Fast, free, and secure.
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 w-full max-w-7xl"
          >
            <FeatureCard
              icon={
                <RiRocketLine className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" />
              }
              title="Lightning Fast"
              description="Powered by Go for blazing-fast sharing and retrieval"
            />
            <FeatureCard
              icon={
                <RiLockLine className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
              }
              title="Secure Sharing"
              description="End-to-end encryption for all your snippets"
            />
            <FeatureCard
              icon={
                <RiGlobalLine className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400" />
              }
              title="Universal Support"
              description="Share any text, from any device"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link to="/create" className="flex items-center hover:text-black duration-700">
                <RiAddLine className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" />{" "}
                Create a Gist
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
      <StarsBackground />
    </Layout>
  );
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg border border-gray-800 rounded-xl overflow-hidden shadow-2xl"
  >
    <CardContent className="p-6 sm:p-8">
      <motion.div
        className="mb-4 sm:mb-6"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-blue-300">
        {title}
      </h3>
      <p className="text-gray-400 text-sm sm:text-base">{description}</p>
    </CardContent>
  </motion.div>
);

export default HomePage;
