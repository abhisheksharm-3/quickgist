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
    content: string,
    file?: File
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", sanitizeInput(title));
      formData.append("description", sanitizeInput(description));
      formData.append("content", content);
      formData.append("isDraft", isDraft.toString());
      if (!isAnonymous && userId) {
        formData.append("userId", userId);
      }
      if (file) {
        formData.append("file", file);
      }
      
      console.log("Submitting gist with data:", Object.fromEntries(formData));
      console.log("isAnonymous:", isAnonymous);
      console.log("userId:", userId);

      const response = await axios.post<GistData>(
        `${import.meta.env.VITE_SERVER_URI}/gist/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      setSubmittedGist(response.data);
      toast.success(file ? "Gist with File uploaded successfully!" : "Gist created successfully!");
    } catch (error) {
      console.error("Error submitting gist:", error);
      toast.error(file ? "Failed to upload file" : "Failed to create a Gist", {
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