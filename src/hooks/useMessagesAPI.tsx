import React, { useState, useEffect, useRef } from "react";
import { Message2, api } from "utils";
import { User } from "./useAuth";

interface MessageProps {
  sender?: User | null;
  targetUser: User;
  chatID: number;
  offset: number;
}

const useMessagesAPI = ({ targetUser, chatID, offset, sender }: MessageProps) => {
  const [messages, setMessages] = useState<Message2[]>([]);
  const [total, setTotal] = useState<number>();
  const socketRef = useRef<WebSocket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const prevChatIDRef = useRef();

  useEffect(() => {
    // Avoid calling fetchMessages if the chatID hasn't actually changed
    if (chatID !== prevChatIDRef.current) {
      fetchMessages(offset);
      prevChatIDRef.current = chatID;
    }
  }, [chatID, offset]);  // Re-run if either chatID or offset changes  

  const fetchMessages = async (offset : number) => {
      try {
        setLoading(true);
        const response = await api.get(`/messages/${chatID}?sort_by=timestamp&order=DESC&skip=${offset}`);
        
        // Append new messages at the top of the list, while maintaining existing ones
        //setMessages((prevMessages) => [...response.data.array[0], ...prevMessages]);
         setMessages([
        ...response.data.array[0].reverse(),
        ...messages,
        ]);
        console.log(messages)
        setTotal(response.data.meta.total)
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

  // Set up WebSocket connection
  useEffect(() => {
    if (targetUser && chatID) {
      const accessToken = localStorage.getItem("access_token");
      const socket = new WebSocket(`ws://localhost:8000/api/v1/ws/${chatID}?token=${accessToken}`);

      socket.onopen = () => {
        console.log("WebSocket connected!");
      };

      socket.onmessage = (event) => {
        const newMessage: Message2 = JSON.parse(event.data);

        // Avoid duplicate messages by checking if the new message already exists
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (msg) => msg.timestamp === newMessage.timestamp && msg.content === newMessage.content
          );
          return isDuplicate ? prev : [...prev, newMessage];
        });
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socketRef.current = socket;

      return () => {
        socket.close();
      };
    }
  }, [targetUser, chatID]);

  // Send a message through WebSocket and handle optimistic UI update
  const sendMessage = (content: string) => {
    if (!content.trim() || !socketRef.current) return;

    const message: Message2 = {
      chat_id: chatID,
      sender_name: sender?.username,
      receiver_id: targetUser.id,
      content,
      timestamp: new Date().toISOString(),
    };

    try {
      socketRef.current.send(JSON.stringify(message));
      console.log("Sending message:", JSON.stringify(message));

      // Optimistic update: Avoid adding a duplicate message in case WebSocket echoes it back
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) => msg.timestamp === message.timestamp && msg.content === message.content
        );
        return isDuplicate ? prev : [...prev, message];
      });
    } catch (error) {
      console.error("Error sending message through WebSocket:", error);
    }
  };

  return {
    messages,
    sendMessage,
    total,
    loading,
    fetchMessages,
  };
};

export { useMessagesAPI };

