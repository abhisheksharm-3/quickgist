import { Avatar } from '@nextui-org/react';
import Layout from '../components/Layout';
import React from 'react';

const ProfilePage: React.FC = () => {
  const user = {
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    joinDate: "January 1, 2023",
    gistsCount: 42,
  };

  return (
<Layout>    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg">
        <Avatar name={user.name} alt="Profile" className="w-24 h-24 rounded-full mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{user.name}</h2>
        <p className="text-gray-300 mb-1">@{user.username}</p>
        <p className="text-gray-300 mb-1">{user.email}</p>
        <p className="text-gray-300 mb-4">Joined: {user.joinDate}</p>
        <p className="text-lg font-semibold">Total Gists: {user.gistsCount}</p>
      </div>
    </div></Layout>
  );
};

export default ProfilePage;