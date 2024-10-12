import React from "react";
import { motion, Variants } from "framer-motion";
import { ChevronRight, Zap, Lock, Globe, File } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { World, GlobeConfig } from "../components/ui/globe";
import { sampleArcs } from "../lib/globeArcs";
import { StarsBackground } from "../components/ui/stars-background";

// Define types
type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

// Animation variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const globeConfig: GlobeConfig = {
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

const HomePage: React.FC = () => (
  <Layout>
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <div className="absolute inset-0 z-10 opacity-90">
        <World data={sampleArcs} globeConfig={globeConfig} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <HeroSection />
        <FeaturesSection />
      </div>
    </div>
  </Layout>
);

const HeroSection: React.FC = () => (
  <section className="text-center mb-32">
    <motion.h1
      className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.7 }}
    >
      QuickGist
    </motion.h1>
    <motion.h2
      className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-gray-100"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      Seamless Code and File Sharing
    </motion.h2>
    <motion.p
      className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      Experience rapid, secure, and efficient sharing of code snippets and files. Designed for developers and teams who value speed and simplicity.
    </motion.p>
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Button
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white hover:text-gray-800 px-8 py-6 rounded-full text-xl font-semibold shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
        asChild
      >
        <Link to="/create" className="flex items-center">
          Start Sharing <ChevronRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </motion.div>
  </section>
);

const FeaturesSection: React.FC = () => (
  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {featuresData.map((feature, index) => (
      <FeatureCard key={index} {...feature} />
    ))}
  </section>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-sm border-gray-800 overflow-hidden h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
        <p className="text-gray-300 flex-grow">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const featuresData: FeatureCardProps[] = [
  {
    icon: <Zap className="h-10 w-10 text-yellow-400" />,
    title: "Lightning Fast",
    description: "Share and access content in milliseconds, enhancing your workflow efficiency.",
  },
  {
    icon: <Lock className="h-10 w-10 text-green-400" />,
    title: "Secure Sharing",
    description: "End-to-end encryption ensures your sensitive data remains protected.",
  },
  {
    icon: <Globe className="h-10 w-10 text-blue-400" />,
    title: "Global Access",
    description: "Collaborate seamlessly with team members and clients worldwide.",
  },
  {
    icon: <File className="h-10 w-10 text-purple-400" />,
    title: "Versatile Sharing",
    description: "Share both code snippets and files with equal ease and efficiency.",
  },
];

export default HomePage;