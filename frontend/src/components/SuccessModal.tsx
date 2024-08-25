import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GistData } from "../lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "./ui/drawer";
import { ClipboardCopyIcon, CheckIcon } from "@radix-ui/react-icons";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  gist: GistData;
  isDesktop: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  gist,
  isDesktop,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const SuccessContent = () => (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6 shadow-inner">
        <h3 className="font-semibold mb-3 text-2xl text-white">{gist.title}</h3>
        <p className="text-lg mb-4 text-gray-300">{gist.description}</p>
        <div className="bg-gray-800 p-4 rounded-md text-sm overflow-hidden">
          <pre className="text-gray-300 whitespace-pre-wrap break-words">
            {gist.content.length > 150
              ? `${gist.content.slice(0, 150)}...`
              : gist.content}
          </pre>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-white mb-2 font-medium">Gist URL:</p>
        <div className="flex items-center">
          <Input
            readOnly
            value={`${import.meta.env.VITE_FRONTEND_URI}/view/${gist.snippetId}`}
            className="bg-gray-700 text-white flex-grow"
          />
          <Button
            onClick={() => copyToClipboard(`${import.meta.env.VITE_FRONTEND_URI}/view/${gist.snippetId}`)}
            className={`ml-2 px-3 transition-colors duration-200 ${
              copied ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            variant="outline"
          >
            {copied ? (
              <CheckIcon className="h-5 w-5 text-white" />
            ) : (
              <ClipboardCopyIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-green-400 text-sm mt-2 transition-opacity duration-200">
            Copied to clipboard!
          </p>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="bg-gray-800 border border-gray-700 shadow-2xl max-w-2xl w-full">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold text-blue-400">
              Gist Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <SuccessContent />
          <div className="flex justify-end mt-8">
            <Button onClick={onClose} className="px-6 py-2">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={() => onClose()}>
      <DrawerContent className="bg-gray-800 border-t border-gray-700">
        <DrawerHeader className="border-b border-gray-700 pb-6">
          <DrawerTitle className="text-2xl font-bold text-blue-400">
            Gist Created Successfully!
          </DrawerTitle>
          <DrawerDescription className="text-gray-300 mt-2">
            Your gist has been created. You can copy the URL or close this drawer.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6">
          <SuccessContent />
        </div>
        <DrawerClose asChild>
          <Button className="mt-6 mx-6 w-calc(100% - 3rem)">Close</Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};