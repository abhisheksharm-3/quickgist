import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RiFileTextLine, RiTimeLine, RiFileCopyLine, RiCodeLine } from "@remixicon/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Layout from "../components/Layout";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { toast } from 'sonner';
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface GistData {
  snippetId: string;
  title: string;
  description: string;
  content: string;
  isDraft: boolean;
  createdAt: string;
}

const ViewPage = () => {
  const { id } = useParams();
  const [gistData, setGistData] = useState<GistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchGistData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<GistData>(`${import.meta.env.VITE_SERVER_URI}/gist/view/${id}`);
        setGistData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch snippet data');
        setLoading(false);
      }
    };

    fetchGistData();
  }, [id]);

  const copyToClipboard = () => {
    if (gistData) {
      navigator.clipboard.writeText(gistData.content);
      toast.error("Copied to Clipboard", {
        description: "You can use it now.",
        style: {
          background: "#2D3748",
          border: "1px solid #4A5568",
          color: "#FFFFFF",
        },
      });
    }
  };

  if (loading) return <Layout><div className="flex justify-center items-center h-screen text-xl font-semibold">Loading...</div></Layout>;
  if (error) return <Layout><div className="flex justify-center items-center h-screen text-xl font-semibold text-red-500">Error: {error}</div></Layout>;
  if (!gistData) return <Layout><div className="flex justify-center items-center h-screen text-xl font-semibold">No data found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
            <CardHeader className="border-b border-gray-700 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-4xl font-bold text-blue-400 flex items-center mb-2">
                    <RiFileTextLine className="mr-3 h-10 w-10" />
                    {gistData.title}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    {gistData.description}
                  </CardDescription>
                </div>
                <Button 
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <RiFileCopyLine className="mr-2 h-5 w-5" /> Copy Code
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-between items-center text-gray-300 mb-6">
                <div className="flex items-center text-lg">
                  <RiTimeLine className="mr-2 h-6 w-6" />
                  <span>{new Date(gistData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <div className="bg-gray-800 text-gray-300 px-4 py-2 flex items-center">
                  <RiCodeLine className="mr-2" />
                  <span className="font-semibold">Snippet</span>
                </div>
                <SyntaxHighlighter 
                  language="javascript" 
                  style={atomDark}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    borderRadius: '0 0 0.5rem 0.5rem',
                  }}
                >
                  {gistData.content}
                </SyntaxHighlighter>
              </div>
              <div className="mt-8 flex justify-end items-center">
                <Button variant="outline" className="mr-4 text-blue-400 hover:text-blue-300 hover:bg-blue-900 border-blue-400 hover:border-blue-300 transition-all duration-200">
                  Raw
                </Button>
                <Button variant="outline" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 border-blue-400 hover:border-blue-300 transition-all duration-200">
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ViewPage;