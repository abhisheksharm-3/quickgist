import React, { useState } from "react";
import { RiCodeLine, RiFileTextLine } from "@remixicon/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface GistFormProps {
  isSubmitting: boolean;
  isAnonymous: boolean;
  isSignedIn: boolean | undefined;
  onSubmit: (isDraft: boolean, title: string, description: string, content: string) => Promise<void>;
  onShowModal: () => void;
}

export const GistForm: React.FC<GistFormProps> = ({
  isSubmitting,
  isAnonymous,
  isSignedIn,
  onSubmit,
  onShowModal,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const handleSubmit = async (isDraft: boolean) => {
    await onSubmit(isDraft, title, description, content);
    onShowModal();
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xl font-medium text-gray-200">
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
        <Label htmlFor="description" className="text-xl font-medium text-gray-200">
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
        <Label htmlFor="content" className="text-xl font-medium text-gray-200">
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
  );
};