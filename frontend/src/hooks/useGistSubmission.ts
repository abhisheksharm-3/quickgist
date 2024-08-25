import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { GistData } from "../lib/types";

export const useGistSubmission = (isAnonymous: boolean, userId?: string) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedGist, setSubmittedGist] = useState<GistData | null>(null);

  const sanitizeInput = (input: string): string => {
    return input.replace(/<[^>]*>?/gm, "");
  };

  const handleSubmit = useCallback(async (
    isDraft: boolean,
    title: string,
    description: string,
    content: string
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const sanitizedData: Omit<GistData, "snippetId"> = {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        content: content,
        isDraft,
        userId: isAnonymous ? undefined : userId,
      };
      
      console.log("Submitting gist with data:", sanitizedData);
      console.log("isAnonymous:", isAnonymous);
      console.log("userId:", userId);

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
      toast.success("Gist created successfully!");
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
  }, [isAnonymous, userId]);

  return { submittedGist, isSubmitting, handleSubmit };
};