import React, { useState, useEffect, useRef } from "react";
import {Message, User, api } from "@/utils";
import { usePostEncrypt } from "@/lib/kubb-he";
import z from "zod";

interface MessageProps {
  sender?: User| undefined;
  targetUser: number;
  chatID: number;
  offset: number;
}

const useMessagesAPI = ({ targetUser, chatID, offset, sender }: MessageProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState<boolean>(false); // Track WebSocket status
  const [isTypingMessage, setIsTyping] = useState<boolean | undefined>(false);
  
  const postEncryptMutation  = usePostEncrypt();
  
  const setupWebSocketConnection = () => {
    const accessToken = localStorage.getItem("access_token");
    const socket = new WebSocket(`wss://khanhmychattypi.win/api/v1/ws/${chatID}?access_token=${accessToken}`);

    socket.onopen = () => {
      console.log("WebSocket connected!");
      setSocketStatus(true); // Set connection status to true
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected!");
      setSocketStatus(false); // Set connection status to false
      setTimeout(setupWebSocketConnection, 3000);
    };

    socket.onmessage = (event) => {
      const newMessage: Message = JSON.parse(event.data);
      if (newMessage.type === "typing") {
        // Update typing status based on incoming event
        setIsTyping(newMessage.is_typing);
      } else {
        // Avoid duplicate messages by checking if the new message already exists
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (msg) => msg.timestamp === newMessage.timestamp && msg.content === newMessage.content
          );
          return isDuplicate ? prev : [...prev, newMessage];
        });
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    if (targetUser && chatID) {
      setupWebSocketConnection();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [targetUser, chatID]);

  const sendMessage = async (content: string, image: string) => {
    if ((!content.trim() && image == "") || !socketRef.current) return;
    
    if (image == "") {
      image = " "
    } 
    const message: Message = {
      chat_id: chatID,
      type: "message",
      sender_name: sender?.username,
      receiver_id: targetUser,
      content,
      image,
      timestamp: new Date().toISOString(),
      is_typing: false,
    };
    try {
      socketRef.current.send(JSON.stringify(message));
      console.log("Sending message:", JSON.stringify(message));

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
  
  const sendTypingEvent = (is : boolean) => {
    if (!socketRef.current) return;

    const typingEvent: Message = {
      chat_id: chatID,
      type: "typing",
      sender_name: sender?.username, 
      receiver_id: targetUser,
      timestamp: new Date().toISOString(),
      is_typing: is,
    };

    try {
      socketRef.current.send(JSON.stringify(typingEvent));
      console.log("Typing event sent:", typingEvent);
    } catch (error) {
      console.error("Error sending typing event:", error);
    }
  };
  
  const encryptData = async (data : Message) => {
        try {
          await postEncryptMutation.mutateAsync({ 
            data : {
              user1_id: user1_id, 
              user2_id: user2_id,
            }
          });

            console.log(response);
            return response.data;
        } catch (error) {
            console.error('Error encrypting data:', error);
            return null;
        }
    };

    const decryptData = async (encryptedData : Message) => {
        try {
            const response = await heApi.post("/decrypt", { encryptedData });
            setDecrypted(true);
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    };

  return {
    messages,
    sendMessage,
    sendTypingEvent,
    socketStatus,
    setupWebSocketConnection,
    isTypingMessage
  };
};

export { useMessagesAPI };

