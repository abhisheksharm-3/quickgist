import React from 'react';
import Layout from '../components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const FAQPage: React.FC = () => {
  const faqItems = [
    { 
      question: "What is QuickGist?", 
      answer: "QuickGist is a platform for developers to create and share code snippets called Gists. It's designed to make sharing code easier and more efficient.",
      category: "General"
    },
    { 
      question: "How do I create a Gist?", 
      answer: "To create a Gist, click the 'Create Gist' button in the navbar. You can then add your code, give it a title, and choose a programming language.",
      category: "Usage"
    },
    { 
      question: "Can I edit my Gists?", 
      answer: "Yes, you can edit your Gists at any time. Navigate to your 'My Gists' page, find the Gist you want to edit, and click the 'Edit' button.",
      category: "Usage"
    },
    { 
      question: "Are Gists private?", 
      answer: "Currently, all Gists on QuickGist are public. However, they are only accessible via a direct link, providing a level of privacy. We plan to implement private Gists in the future.",
      category: "Privacy"
    },
    { 
      question: "Can I collaborate on Gists with others?", 
      answer: "Collaboration features are coming soon to QuickGist. We're excited to introduce ways for users to work together on code snippets in the near future.",
      category: "Coming Soon"
    },
    { 
      question: "How can I find Gists created by others?", 
      answer: "At the moment, Gists are only accessible via their direct links. We're working on implementing a search function to make discovering Gists easier.",
      category: "Coming Soon"
    },
    { 
      question: "Is there a limit to how many Gists I can create?", 
      answer: "There's no strict limit on the number of Gists you can create. However, we encourage responsible use of the platform to ensure a good experience for all users.",
      category: "Usage"
    },
    { 
      question: "How can I delete a Gist?", 
      answer: "To delete a Gist, go to your 'My Gists' page, find the Gist you want to remove, and click the 'Delete' button. Please note that this action is irreversible.",
      category: "Usage"
    },
  ];

  // Group FAQ items by category
  const groupedFAQs = faqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof faqItems>);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Find answers to common questions about QuickGist and how to use our platform effectively.
            </p>
          </CardContent>
        </Card>

        {Object.entries(groupedFAQs).map(([category, items]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                {category}
                <Badge variant="secondary" className="ml-2">
                  {items.length} {items.length === 1 ? 'Question' : 'Questions'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {items.map((item, index) => (
                  <AccordionItem key={index} value={`item-${category}-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default FAQPage;