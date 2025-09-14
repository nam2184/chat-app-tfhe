import { Collapse, Skeleton } from "@/components";
import React, { useContext } from "react";
import {  User } from "@/utils/interfaces"
import { OnlineUsers } from "./OnlineUsers";
import { Conversation } from "./Conversation";
import { useGetUserSuspense,useGetChatsSuspense, useGetUsersSuspense, usePostChats } from "@/lib/kubb";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddUsers } from "./AddUsers";
import { useQueryClient } from "@tanstack/react-query";
import { useGetClientUserId } from "@/lib/kubb-he";

const postChatSchema = z.object({
  user1_id: z.number(),
  user2_id: z.number(),
});


const ChatComp: React.FC = () => {
    
    const queryClient = useQueryClient();
    const userGet = useGetUserSuspense()
    const clientGet = useGetClientUserId(userGet.data.id!)
    const usersGet = useGetUsersSuspense()
    const chatGet = useGetChatsSuspense()

    const sender = userGet.data
    
    const form = useForm<z.infer<typeof postChatSchema>>({
      resolver: zodResolver(postChatSchema),
      defaultValues: {
      },
    });
    
    const postChatsMutation = usePostChats({
      mutation: {
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: usersGet.queryKey,
            refetchType: "all",
          });
          queryClient.invalidateQueries({
            queryKey: chatGet.queryKey,
            refetchType: "all",
          });
        },
      },
    });

    const handlePostChats = async (user1_id : number, user2_id : number) => {
        try {
          await postChatsMutation.mutateAsync({ 
            data : {
              user1_id: user1_id, 
              user2_id: user2_id,
            }
          });
        } catch (e: unknown) {
            if (e instanceof Error) {
              form.setError("root", {
                message: e.message,
              });
         }
        }
      };
 
    const targetScroll = React.useRef<HTMLDivElement>(null);
    const [isBottom, setIsBottom] = React.useState<boolean>(false);
    const [reciever, setReciever] = React.useState<User | null>(null);
    const [chatID, setChatID] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (targetScroll.current) {
            targetScroll.current.scrollTop = targetScroll.current.scrollHeight;
            targetScroll.current.scrollIntoView({ behavior: "smooth" });
            targetScroll.current.addEventListener("scroll", () => {
                if (targetScroll.current) {
                    setIsBottom(targetScroll.current.scrollTop === 0);
                }
            });
        }
    }, []);

    const handleOnOnlineUserClick = (reciever: User, chatID: number) => {
        console.log("Change chat ID to ", chatID)
        setReciever(reciever);
        setChatID(chatID);
    };


    return (
        <main className="w-full 2xl:w-9/12 2xl:mx-auto">
            <div className="grid grid-cols-3 gap-2 h-screen overflow-hidden">
                {/* Sidebar */}
                <section className="col-span-1">
                    <div className="flex flex-col h-full">
                        {/* Search */}
                        <div className="flex flex-col w-full p-2">
                            <div className="bg-gray-100 flex items-center rounded-lg p-1 gap-1">
                                <input
                                    type="text"
                                    className="w-full text-sm p-1 rounded-md border border-gray-300 focus:outline-none max-w-full"
                                    placeholder="Search"
                                />
                                <button className="bg-spanishViolet-400 text-white rounded-md p-1">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {/* Online Users & Chats */}
                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-2">
                            <Collapse label="Online Now">
                                <div className="flex flex-col gap-2 overflow-auto" id="online">
                                    {usersGet.isPending ? (
                                        <Skeleton />
                                    ) : (
                                        <OnlineUsers
                                            onClick={handleOnOnlineUserClick}
                                            response={chatGet.data}
                                        />
                                    )}
                                </div>
                            </Collapse>
                            <Collapse label="Add these users">
                                <div className="flex flex-col gap-2 overflow-auto" id="online">
                                    {chatGet.isPending ? (
                                        <Skeleton />
                                    ) : (
                                        <AddUsers
                                            onClick={handlePostChats}
                                            sender={userGet.data}
                                            response={usersGet.data}
                                        />
                                    )}
                                </div>
                            </Collapse>
                            <h2 className="text-xl font-bold text-black">My Chats</h2>
                            <div className="flex flex-col gap-2"></div>
                        </div>
                    </div>
                </section>

                {/* Chat Section */}
                <section className="col-span-2 h-full">
                    {reciever? (
                        <Conversation
                            sender={sender}
                            reciever={reciever}
                            chatID={chatID!!}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">Select a user to start chatting</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export { ChatComp };

