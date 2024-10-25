import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { CalendarIcon, MailIcon, CodeIcon, BookOpenIcon } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";

interface Gist {
  snippetId: string;
  title: string;
  createdAt: string;
  language: string;
}

const ProfilePage: React.FC = () => {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loadingGists, setLoadingGists] = useState(true);

  useEffect(() => {
    if (isAuthLoaded && !userId) {
      navigate("/sign-in");
    }
  }, [isAuthLoaded, userId, navigate]);

  useEffect(() => {
    const fetchGists = async () => {
      if (isUserLoaded && user) {
        try {
          const response = await axios.get<Gist[]>(
            `${import.meta.env.VITE_SERVER_URI}/gist/user-gists?userId=${
              user.id
            }`
          );
          if (response.data) {
            setGists(
              response.data.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
            );
          }
        } catch (error) {
          console.error("Error fetching gists:", error);
        } finally {
          setLoadingGists(false);
        }
      }
    };

    fetchGists();
  }, [isUserLoaded, user]);

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-8 w-[250px] mt-4 mx-auto" />
          <Skeleton className="h-4 w-[200px] mt-2 mx-auto" />
          <Skeleton className="h-[400px] w-full mt-8 rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Layout>
      <div className="relative min-h-screen flex items-center justify-center bg-zinc-950">
        {/* Brutalist pattern background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#222_20px,#222_21px)]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
            <Card className="bg-zinc-950 border-8 border-cyan-500 shadow-[12px_12px_0px_0px_rgba(6,182,212,0.3)] rotate-1">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Avatar className="w-32 h-32 border-4 border-pink-500 shadow-[8px_8px_0px_0px_rgba(236,72,153,0.3)]">
                      <AvatarImage src={user.imageUrl} alt="Profile" />
                      <AvatarFallback className="text-4xl bg-pink-500">
                        {user.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black font-mono text-cyan-400">
                      {user.fullName}
                    </h1>
                    <Badge className="mt-2 bg-pink-500 border-2 border-pink-400 text-white font-mono">
                      @{user.username}
                    </Badge>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                      {[
                        {
                          icon: <MailIcon />,
                          text: user.primaryEmailAddress?.emailAddress,
                          color: "purple",
                        },
                        {
                          icon: <CalendarIcon />,
                          text: `Joined ${joinDate}`,
                          color: "green",
                        },
                        {
                          icon: <CodeIcon />,
                          text: `${gists.length} Gists`,
                          color: "orange",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          whileHover={{
                            scale: 1.05,
                            rotate: index % 2 === 0 ? 2 : -2,
                          }}
                          className={`flex items-center justify-center bg-zinc-900 border-6 border-${
                            item.color
                          }-500 
                                    p-4 shadow-[8px_8px_0px_0px_rgba(236,72,153,0.3)]
                                    ${
                                      index % 2 === 0 ? "rotate-2" : "-rotate-2"
                                    }`}
                        >
                          <span className={`mr-3 text-${item.color}-400`}>
                            {item.icon}
                          </span>
                          <span className="text-base font-mono text-zinc-200">
                            {item.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-950 border-4 border-blue-500 p-1 mb-4">
              <TabsTrigger
                value="recent"
                className="font-mono font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Recent Gists
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="font-mono font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                All Gists
              </TabsTrigger>
            </TabsList>

            {["recent", "all"].map((tab, index) => (
              <TabsContent key={tab} value={tab}>
                <motion.div
                  initial={{ x: index % 2 === 0 ? -1000 : 1000 }}
                  animate={{ x: 0 }}
                >
                  <Card className="bg-zinc-950 border-8 border-purple-500 shadow-[12px_12px_0px_0px_rgba(168,85,247,0.3)] -rotate-1">
                    <CardHeader>
                      <CardTitle className="text-2xl font-black font-mono text-purple-400">
                        {tab === "recent" ? "Recent Gists" : "All Gists"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingGists ? (
                        <Skeleton className="h-[300px] w-full rounded-lg" />
                      ) : gists.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-4">
                          {(tab === "recent" ? gists.slice(0, 5) : gists).map(
                            (gist) => (
                              <GistItem key={gist.snippetId} gist={gist} />
                            )
                          )}
                        </ScrollArea>
                      ) : (
                        <p className="text-center py-8 font-mono text-zinc-400">
                          No gists to show.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

const GistItem: React.FC<{ gist: Gist }> = ({ gist }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="mb-4">
    <div
      className="bg-zinc-950 border-4 border-orange-500 p-4 rounded-lg shadow-[8px_8px_0px_0px_rgba(249,115,22,0.3)] rotate-1
                  hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)]
                  transition-all duration-200"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold font-mono">
            <a
              href={`/view/${gist.snippetId}`}
              className="text-orange-400 hover:underline"
            >
              {gist.title}
            </a>
          </h3>
          <p className="text-sm text-zinc-400 font-mono mt-1">
            Created: {new Date(gist.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className="bg-green-500 border-2 border-green-400 text-white font-mono">
          {gist.language}
        </Badge>
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-4 border-cyan-500 text-cyan-400 font-mono font-bold
                   shadow-[4px_4px_0px_0px_rgba(6,182,212,0.3)]
                   hover:shadow-[2px_2px_0px_0px_rgba(6,182,212,0.3)]
                   hover:translate-x-1 hover:translate-y-1
                   transition-all duration-200"
        >
          <BookOpenIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </div>
    </div>
  </motion.div>
);

export default ProfilePage;
