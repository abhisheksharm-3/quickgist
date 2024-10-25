import React, { useState } from "react";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  HelpCircleIcon,
  MessageCircleIcon,
  LockIcon,
  RocketIcon,
} from "lucide-react";

const FAQPage: React.FC = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoryIcons: Record<string, JSX.Element> = {
    General: <HelpCircleIcon className="h-6 w-6" />,
    Usage: <MessageCircleIcon className="h-6 w-6" />,
    Privacy: <LockIcon className="h-6 w-6" />,
    "Coming Soon": <RocketIcon className="h-6 w-6" />,
  };

  const categoryColors: Record<string, string> = {
    General: "cyan",
    Usage: "pink",
    Privacy: "purple",
    "Coming Soon": "orange",
  };

  const faqItems = [
    {
      question: "What is QuickGist?",
      answer:
        "QuickGist is a platform for developers to create and share code snippets called Gists. It's designed to make sharing code easier and more efficient.",
      category: "General",
    },
    {
      question: "How do I create a Gist?",
      answer:
        "To create a Gist, click the 'Create Gist' button in the navbar. You can then add your code, give it a title, and choose a programming language.",
      category: "Usage",
    },
    {
      question: "Can I edit my Gists?",
      answer:
        "Yes, you can edit your Gists at any time. Navigate to your 'My Gists' page, find the Gist you want to edit, and click the 'Edit' button.",
      category: "Usage",
    },
    {
      question: "Are Gists private?",
      answer:
        "Currently, all Gists on QuickGist are public. However, they are only accessible via a direct link, providing a level of privacy. We plan to implement private Gists in the future.",
      category: "Privacy",
    },
    {
      question: "Can I collaborate on Gists with others?",
      answer:
        "Collaboration features are coming soon to QuickGist. We're excited to introduce ways for users to work together on code snippets in the near future.",
      category: "Coming Soon",
    },
    {
      question: "How can I find Gists created by others?",
      answer:
        "At the moment, Gists are only accessible via their direct links. We're working on implementing a search function to make discovering Gists easier.",
      category: "Coming Soon",
    },
    {
      question: "Is there a limit to how many Gists I can create?",
      answer:
        "There's no strict limit on the number of Gists you can create. However, we encourage responsible use of the platform to ensure a good experience for all users.",
      category: "Usage",
    },
    {
      question: "How can I delete a Gist?",
      answer:
        "To delete a Gist, go to your 'My Gists' page, find the Gist you want to remove, and click the 'Delete' button. Please note that this action is irreversible.",
      category: "Usage",
    },
  ];

  const groupedFAQs = faqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof faqItems>);

  const backgroundPatterns = [
    "bg-[repeating-linear-gradient(45deg,#222,#222_2px,transparent_2px,transparent_12px)]",
    "bg-[repeating-linear-gradient(-45deg,#333,#333_1px,transparent_1px,transparent_12px)]",
  ];

  return (
    <Layout>
      <div className="relative min-h-screen bg-zinc-950">
        {/* Layered brutalist patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Knitted Pattern */}
          {backgroundPatterns.map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ delay: index * 0.2 }}
              className={`absolute inset-0 ${pattern}`}
              style={{ transform: `rotate(${index * 15}deg)` }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-12"
          >
            <Card
              className="bg-zinc-950 border-[12px] border-cyan-500 
                           shadow-[16px_16px_0px_0px_rgba(6,182,212,0.4)] rotate-2"
            >
              <CardHeader className="p-8">
                <CardTitle className="text-5xl font-black font-mono text-cyan-400 flex items-center gap-4">
                  FAQ
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <HelpCircleIcon className="h-12 w-12" />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-xl font-mono text-zinc-400">
                  Everything you need to know about QuickGist, wrapped in a neat
                  little package.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(
              ([category, items], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  onHoverStart={() => setHoveredCategory(category)}
                  onHoverEnd={() => setHoveredCategory(null)}
                >
                  <Card
                    className={`bg-zinc-950 border-8 border-${
                      categoryColors[category]
                    }-500
                                shadow-[12px_12px_0px_0px_rgba(236,72,153,0.4)]
                                ${
                                  hoveredCategory === category
                                    ? "rotate-0"
                                    : categoryIndex % 2 === 0
                                    ? "rotate-1"
                                    : "-rotate-1"
                                }
                                transition-all duration-300`}
                  >
                    <CardHeader className="p-6">
                      <CardTitle
                        className={`text-2xl font-black font-mono text-${categoryColors[category]}-400 
                                        flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-4">
                          {categoryIcons[category]}
                          {category}
                        </div>
                        <Badge
                          className={`bg-${categoryColors[category]}-500 border-4 border-${categoryColors[category]}-400 
                                      text-white font-mono text-lg p-2
                                      shadow-[4px_4px_0px_0px_rgba(236,72,153,0.4)]`}
                        >
                          {items.length}{" "}
                          {items.length === 1 ? "Question" : "Questions"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {items.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`item-${category}-${index}`}
                            className={`border-4 border-${categoryColors[category]}-500 mb-4 last:mb-0
                                    data-[state=open]:bg-zinc-900/50
                                    data-[state=open]:shadow-[8px_8px_0px_0px_rgba(236,72,153,0.3)]`}
                          >
                            <AccordionTrigger
                              className={`p-4 hover:bg-${categoryColors[category]}-500/10
                                      data-[state=open]:bg-${categoryColors[category]}-500/20
                                      font-mono font-bold text-lg group rounded-none`}
                            >
                              <motion.div
                                initial={false}
                                className="flex items-center gap-2"
                              >
                                {item.question}
                                <motion.span
                                  animate={{
                                    rotate:
                                      hoveredCategory === category ? 360 : 0,
                                    scale:
                                      hoveredCategory === category ? 1.1 : 1,
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className={`text-${categoryColors[category]}-400`}
                                >
                                  {categoryIcons[category]}
                                </motion.span>
                              </motion.div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4">
                              <p className="font-mono text-zinc-400 leading-relaxed">
                                {item.answer}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQPage;
