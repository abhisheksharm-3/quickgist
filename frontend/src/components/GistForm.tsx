import React, { useState, ChangeEvent } from "react";
import { RiCodeLine, RiFileTextLine, RiUpload2Line } from "@remixicon/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "./ui/badge";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(30, "Title must be 30 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less"),
  content: z.string().min(1, "Content is required"),
});

type FormData = z.infer<typeof formSchema>;

interface GistFormProps {
  isSubmitting: boolean;
  isAnonymous: boolean;
  isSignedIn: boolean | undefined;
  onSubmit: (isDraft: boolean, title: string, description: string, content: string, file?: File) => Promise<void>;
  onShowModal: () => void;
}

export const GistForm: React.FC<GistFormProps> = ({
  isSubmitting,
  isAnonymous,
  isSignedIn,
  onSubmit,
  onShowModal,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmitForm = async (data: FormData, isDraft: boolean) => {
    await onSubmit(isDraft, data.title, data.description, data.content, file || undefined);
    onShowModal();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError("File size should be less than 5MB");
        setFile(null);
      } else {
        setFileError(null);
        setFile(selectedFile);
      }
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xl font-medium text-gray-200">
          Title
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter a title for your gist"
          className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xl font-medium text-gray-200">
          Description
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe your gist"
          className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-xl font-medium text-gray-200">
          Content
        </Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="Paste your code or text here"
          className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 min-h-[200px] text-lg"
        />
        {errors.content && <p className="text-red-500">{errors.content.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file" className="text-xl font-medium text-gray-200 flex items-center">
          Upload File <Badge className="ml-2 bg-green-500 text-white">New Feature</Badge>
        </Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        {file && <p className="text-green-500">File selected: {file.name}</p>}
        {fileError && <p className="text-red-500">{fileError}</p>}
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 text-xl"
          onClick={handleSubmit((data) => onSubmitForm(data, false))}
          disabled={isSubmitting || (!isAnonymous && !isSignedIn)}
        >
          {file ? <RiUpload2Line className="mr-2 h-6 w-6" /> : <RiCodeLine className="mr-2 h-6 w-6" />}
          {isSubmitting ? "Submitting..." : "Create Snippet"}
        </Button>
        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 text-xl"
          onClick={handleSubmit((data) => onSubmitForm(data, true))}
          disabled={isSubmitting || (!isAnonymous && !isSignedIn)}
        >
          <RiFileTextLine className="mr-2 h-6 w-6" />
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>
      </div>
    </form>
  );
};