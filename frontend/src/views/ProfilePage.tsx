import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { CalendarIcon, MailIcon, ActivityIcon } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthLoaded && !userId) {
      navigate('/sign-in');
    }
  }, [isAuthLoaded, userId, navigate]);

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px] mt-4" />
          <Skeleton className="h-4 w-[200px] mt-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.imageUrl} alt="Profile" />
                <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold mt-4">{user.fullName}</h1>
              <Badge variant="secondary" className="mt-2">@{user.username}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-semibold">
                <MailIcon className="mr-2" /> User Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="flex items-center">
                  <MailIcon className="mr-2 h-4 w-4" />
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <p className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Joined: {joinDate}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-semibold">
                <ActivityIcon className="mr-2" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent activity to show.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;