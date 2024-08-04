import Layout from '../components/Layout';
import React from 'react';

const FAQPage: React.FC = () => {
  const faqItems = [
    { question: "What is a Gist?", answer: "A Gist is a simple way to share snippets of code with others." },
    { question: "How do I create a Gist?", answer: "You can create a Gist by clicking the 'Create Gist' button in the navbar." },
    { question: "Can I edit my Gists?", answer: "Yes, you can edit your Gists at any time from your 'My Gists' page." },
    { question: "Are Gists public?", answer: "By default, Gists are public, but you can create private Gists as well." },
  ];

  return (
    <Layout><div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
    <div className="space-y-6">
      {faqItems.map((item, index) => (
        <div key={index} className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">{item.question}</h2>
          <p className="text-gray-300">{item.answer}</p>
        </div>
      ))}
    </div>
  </div></Layout>
  );
};

export default FAQPage;