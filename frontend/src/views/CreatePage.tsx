import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiFileAddLine } from "@remixicon/react";
import Layout from "../components/Layout";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Switch } from "@nextui-org/react";
import { GistForm } from "../components/GistForm";
import { SuccessModal } from "../components/SuccessModal";
import { useMediaQuery } from "../hooks/use-media-query";
import { useGistSubmission } from "../hooks/useGistSubmission";
import { GistData } from "../lib/types";

const CreatePage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  
  const { submittedGist, isSubmitting, handleSubmit } = useGistSubmission(isAnonymous, user?.id);

  useEffect(() => {
    if (isLoaded) {
      setIsAnonymous(!isSignedIn);
    }
  }, [isLoaded, isSignedIn]);

  const closeModalAndReset = (): void => {
    setShowModal(false);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleAnonymousToggle = (value: boolean) => {
    setIsAnonymous(value);
    console.log("Anonymous mode toggled to:", value);
    console.log("User ID:", user?.id);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

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
          
          <GistForm 
            isSubmitting={isSubmitting}
            isAnonymous={isAnonymous}
            isSignedIn={isSignedIn}
            onSubmit={handleSubmit}
            onShowModal={handleShowModal}
          />

          {isSignedIn && (
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="anonymous"
                color="success"
                checked={isAnonymous}
                onValueChange={handleAnonymousToggle}
              />
              <label htmlFor="anonymous" className="text-lg text-gray-200">
                Create anonymously
              </label>
            </div>
          )}

          {!isSignedIn && (
            <p className="text-yellow-400 mt-4">
              You are not signed in. Gists will be created anonymously.
            </p>
          )}
        </motion.div>

        <SuccessModal
          isOpen={showModal}
          onClose={closeModalAndReset}
          gist={submittedGist as GistData}
          isDesktop={isDesktop}
        />
      </div>
    </Layout>
  );
};

export default CreatePage;