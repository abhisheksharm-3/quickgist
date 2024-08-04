import React, { useState, ChangeEvent, DragEvent } from "react";
import { motion } from "framer-motion";
import { RiFileAddLine, RiUploadCloud2Line, RiFileTextLine, RiCodeLine } from "@remixicon/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import Layout from "../components/Layout";

const CreatePage: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <h1 className="text-4xl font-bold text-blue-400 mb-8 flex items-center">
            <RiFileAddLine className="mr-4 h-10 w-10" />
            Create New Gist
          </h1>
          <form className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-lg font-medium text-gray-200 mb-2 block">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter a title for your gist" 
                className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-lg font-medium text-gray-200 mb-2 block">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe your gist" 
                className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-lg font-medium text-gray-200 mb-2 block">Content</Label>
              <Textarea 
                id="content" 
                placeholder="Paste your code or text here" 
                className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
              />
            </div>
            <div>
              <Label className="text-lg font-medium text-gray-200 mb-2 block">Or Upload a File</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'} transition-colors duration-300`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <RiUploadCloud2Line className="h-16 w-16 text-blue-400 mb-4" />
                    <p className="text-lg text-gray-300">
                      {file ? file.name : 'Drag and drop your file here, or click to select'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg">
                <RiCodeLine className="mr-2 h-5 w-5" />
                Create Gist
              </Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg">
                <RiFileTextLine className="mr-2 h-5 w-5" />
                Save as Draft
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreatePage;