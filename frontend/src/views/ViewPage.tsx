import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { FileText, Clock, Copy, Download, ChevronDown, ChevronUp, File } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import Layout from '../components/Layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

export interface GistData {
  snippetId: string;
  title: string;
  description: string;
  content: string;
  isDraft: boolean;
  createdAt: string;
  fileName?: string;
  fileURL?: string;
}

const ViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [gistData, setGistData] = useState<GistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedContent, setExpandedContent] = useState(false);
  const [contentPreview, setContentPreview] = useState('');

  useEffect(() => {
    const fetchGistData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<GistData>(`${import.meta.env.VITE_SERVER_URI}/gist/view/${id}`);
        setGistData(response.data);
        setContentPreview(response.data.content.slice(0, 1000)); // Show first 1000 characters
      } catch (err) {
        setError('Failed to fetch snippet data');
      } finally {
        setLoading(false);
      }
    };

    fetchGistData();
  }, [id]);

  const copyToClipboard = () => {
    if (gistData) {
      navigator.clipboard.writeText(gistData.content);
      toast.success('Copied to Clipboard', {
        description: 'You can use it now.',
      });
    }
  };

  const downloadRaw = () => {
    if (gistData) {
      const blob = new Blob([gistData.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gistData.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!gistData) return <ErrorDisplay message="No data found" />;

  return (
    <Layout>
      <motion.div
        className="max-w-full sm:max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card overflow-hidden">
          <CardHeader className="border-b space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1 w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 truncate">
                        <FileText className="h-6 w-6 flex-shrink-0" />
                        <span className="truncate">{gistData.title}</span>
                      </CardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{gistData.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CardDescription className="text-muted-foreground text-sm sm:text-base break-words">
                  {gistData.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={downloadRaw}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <time dateTime={gistData.createdAt}>
                {new Date(gistData.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="preview" className="data-[state=active]:bg-background">Preview</TabsTrigger>
                <TabsTrigger value="raw" className="data-[state=active]:bg-background">Raw</TabsTrigger>
                {gistData.fileName && gistData.fileURL && (
                  <TabsTrigger value="files" className="data-[state=active]:bg-background">Files</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="preview" className="m-0">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      onClick={copyToClipboard}
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language="javascript"
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        padding: '2rem 1rem',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        maxHeight: expandedContent ? 'none' : '400px',
                        overflow: expandedContent ? 'visible' : 'auto',
                      }}
                      showLineNumbers
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {expandedContent ? gistData.content : contentPreview}
                    </SyntaxHighlighter>
                  </div>
                  {gistData.content.length > 1000 && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={() => setExpandedContent(!expandedContent)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {expandedContent ? (
                          <>
                            <ChevronUp className="mr-1 h-3 w-3" /> Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3 w-3" /> Show More
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="raw" className="m-0">
                <pre className="bg-muted p-4 rounded-b-lg overflow-x-auto whitespace-pre-wrap break-words text-sm max-h-[400px] overflow-y-auto">
                  <code>{gistData.content}</code>
                </pre>
                {gistData.content.length > 1000 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => setExpandedContent(!expandedContent)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {expandedContent ? (
                        <>
                          <ChevronUp className="mr-1 h-3 w-3" /> Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3 w-3" /> Show More
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
              {gistData.fileName && gistData.fileURL && (
                <TabsContent value="files" className="m-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <File className="h-5 w-5" />
                        <span className="font-medium">{gistData.fileName}</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_SERVER_URI}${gistData.fileURL}`}
                        download={gistData.fileName}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

const LoadingSkeleton: React.FC = () => (
  <Layout>
    <div className="max-w-full sm:max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2 w-full">
              <Skeleton className="h-6 sm:h-8 w-full sm:w-3/4" />
              <Skeleton className="h-4 w-full sm:w-1/2" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Skeleton className="h-8 w-16 sm:w-20" />
              <Skeleton className="h-8 w-16 sm:w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-32 sm:w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] sm:h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  </Layout>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <Layout>
    <div className="flex justify-center items-center h-[calc(100vh-4rem)] text-xl font-semibold text-red-500">
      {message}
    </div>
  </Layout>
);

export default ViewPage;