import React from 'react';
import { Link } from '@nextui-org/react';
import Layout from '../components/Layout';

const MyGistsPage: React.FC = () => {
  const gists = [
    { id: 1, title: "React Hooks Example", language: "JavaScript", created: "2023-07-15" },
    { id: 2, title: "Python Data Structures", language: "Python", created: "2023-08-02" },
    { id: 3, title: "CSS Flexbox Cheatsheet", language: "CSS", created: "2023-08-10" },
    { id: 4, title: "SQL Queries for Beginners", language: "SQL", created: "2023-08-20" },
  ];

  return (
    <Layout><div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">My Gists</h1>
    <div className="space-y-4">
      {gists.map((gist) => (
        <div key={gist.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
          <div>
            <Link href={`/view/${gist.id}`} className="text-xl font-semibold hover:underline">
              {gist.title}
            </Link>
            <p className="text-gray-300">Language: {gist.language}</p>
            <p className="text-gray-400 text-sm">Created: {gist.created}</p>
          </div>
          <div className="space-x-2">
            <Link href={`/edit/${gist.id}`} className="text-blue-400 hover:underline">Edit</Link>
            <button className="text-red-400 hover:underline">Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div></Layout>
  );
};

export default MyGistsPage;