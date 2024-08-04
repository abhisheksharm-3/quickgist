
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RiFileTextLine, RiTimeLine, RiUser3Line, RiStarLine, RiGitBranchLine } from "@remixicon/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Layout from "../components/Layout";

const ViewPage = () => {
  const { id } = useParams();

  // Dummy data
  const gistData = {
    id: id,
    title: "Awesome React Hooks",
    description: "A collection of custom React hooks for common use cases",
    content: `import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useLocalStorage = (key, initialValue) => {
  // ... implementation
};

export const useMediaQuery = (query) => {
  // ... implementation
};`,
    language: "javascript",
    author: "SpaceCoderX",
    created: "2024-08-01T12:00:00Z",
    stars: 42,
    forks: 13,
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="bg-gray-800 border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-3xl font-bold text-blue-400 flex items-center">
                    <RiFileTextLine className="mr-2 h-8 w-8" />
                    {gistData.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    {gistData.description}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900">
                    <RiStarLine className="mr-1" /> Star
                  </Button>
                  <Button variant="outline" className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-gray-900">
                    <RiGitBranchLine className="mr-1" /> Fork
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-gray-400 mb-4">
                <div className="flex items-center">
                  <RiUser3Line className="mr-2" />
                  <span>{gistData.author}</span>
                </div>
                <div className="flex items-center">
                  <RiTimeLine className="mr-2" />
                  <span>{new Date(gistData.created).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 whitespace-pre-wrap">
                  <code>{gistData.content}</code>
                </pre>
              </div>
              <div className="mt-6 flex justify-between items-center text-gray-400">
                <div className="flex space-x-4">
                  <span className="flex items-center">
                    <RiStarLine className="mr-1" /> {gistData.stars} stars
                  </span>
                  <span className="flex items-center">
                    <RiGitBranchLine className="mr-1" /> {gistData.forks} forks
                  </span>
                </div>
                <div>
                  <Button variant="link" className="text-blue-400 hover:text-blue-300">
                    Raw
                  </Button>
                  <Button variant="link" className="text-blue-400 hover:text-blue-300">
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ViewPage;