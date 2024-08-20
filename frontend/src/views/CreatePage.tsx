import React, { useState } from "react";
import { motion } from "framer-motion";
import { RiFileAddLine, RiCodeLine, RiFileTextLine } from "@remixicon/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "../components/ui/drawer";
import Layout from "../components/Layout";
import axios from "axios";
import { toast } from "sonner";
import { useMediaQuery } from "../hooks/use-media-query";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Switch } from "@nextui-org/react";

interface GistData {
  snippetId: string;
  title: string;
  description: string;
  content: string;
  isDraft: boolean;
  userId?: string;
}

const CreatePage: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submittedGist, setSubmittedGist] = useState<GistData | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const sanitizeInput = (input: string): string => {
    return input.replace(/<[^>]*>?/gm, "");
  };

  const handleSubmit = async (isDraft: boolean): Promise<void> => {
    if (!isAnonymous && !isSignedIn) {
      toast.error("Please sign in to save the gist to your account", {
        description: "You can sign in or switch to anonymous mode to continue.",
        style: {
          background: "#2D3748",
          border: "1px solid #4A5568",
          color: "#FFFFFF",
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedData: Omit<GistData, "snippetId"> = {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        content: content,
        isDraft,
        userId: isAnonymous ? undefined : user?.id,
      };
      console.log(sanitizedData);
      console.log(isAnonymous);
      
      const response = await axios.post<GistData>(
        `${import.meta.env.VITE_SERVER_URI}/gist/create`,
        sanitizedData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setSubmittedGist(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error submitting gist:", error);
      toast.error("Failed to create a Gist", {
        description: "Please try again later.",
        style: {
          background: "#2D3748",
          border: "1px solid #4A5568",
          color: "#FFFFFF",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModalAndReset = (): void => {
    setShowModal(false);
    setTitle("");
    setDescription("");
    setContent("");
    setSubmittedGist(null);
    setIsAnonymous(true);
  };

  const SuccessContent = () => (
    <div className="space-y-4">
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-xl text-white">
          {submittedGist?.title}
        </h3>
        <p className="text-lg mb-2 text-gray-300">
          {submittedGist?.description}
        </p>
        <pre className="bg-gray-800 p-4 rounded text-sm overflow-x-auto text-gray-300">
          {submittedGist?.content.slice(0, 100)}...
        </pre>
      </div>
      <div className="mt-4">
        <p className="text-white mb-2">Snippet URL:</p>
        <Input
          readOnly
          value={`${import.meta.env.VITE_FRONTEND_URI}/view/${
            submittedGist?.snippetId
          }`}
          className="bg-gray-700 text-white"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={closeModalAndReset}>Close</Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-b from-cyan-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl rounded-xl shadow-lg p-6 sm:p-8 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg border border-gray-700"
        >
          <h1 className="text-5xl font-bold text-blue-400 mb-8 flex items-center">
            <RiFileAddLine className="mr-4 h-12 w-12" />
            Create New Gist
          </h1>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-xl font-medium text-gray-200"
              >
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your gist"
                className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-lg"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xl font-medium text-gray-200"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your gist"
                className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-lg"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-xl font-medium text-gray-200"
              >
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your code or text here"
                className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 min-h-[200px] text-lg"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                color="success"
                checked={isAnonymous}
                onValueChange={(isAnonymous) => (setIsAnonymous(!isAnonymous))}
              />
              <Label htmlFor="anonymous" className="text-lg text-gray-200">
                Create anonymously
              </Label>
            </div>

            {!isAnonymous && !isSignedIn && (
              <p className="text-yellow-400">
                Please sign in to save the gist to your account.
              </p>
            )}

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 text-xl"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || (!isAnonymous && !isSignedIn)}
              >
                <RiCodeLine className="mr-2 h-6 w-6" />
                {isSubmitting ? "Submitting..." : "Create Gist"}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 text-xl"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || (!isAnonymous && !isSignedIn)}
              >
                <RiFileTextLine className="mr-2 h-6 w-6" />
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
            </div>
          </form>
        </motion.div>

        {isDesktop ? (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="bg-gray-800 border border-gray-700 shadow-2xl max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-blue-400">
                  Gist Created Successfully!
                </DialogTitle>
              </DialogHeader>
              <SuccessContent />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={showModal} onOpenChange={setShowModal}>
            <DrawerContent className="bg-gray-800 border-t border-gray-700">
              <DrawerHeader className="border-b border-gray-700">
                <DrawerTitle className="text-2xl font-bold text-blue-400">
                  Gist Created Successfully!
                </DrawerTitle>
                <DrawerDescription className="text-gray-300">
                  Your gist has been created. You can copy the URL or close this
                  drawer.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <SuccessContent />
              </div>
              <DrawerClose asChild>
                <Button className="mt-4 mx-4">Close</Button>
              </DrawerClose>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </Layout>
  );
};

export default CreatePage;
