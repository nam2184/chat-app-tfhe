import React, { useState, useRef } from "react";
import {Message, User, api } from "@/utils";
import { EncryptedMessage, postDecrypt, usePostDecrypt, usePostEncrypt, usePostMessage } from "@/lib/kubb-he";

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
  const postDecryptMutation  = usePostDecrypt();
  
  const setupWebSocketConnection = async () => {
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
      const newMessage: EncryptedMessage = JSON.parse(event.data);

      (async () => {
        const decryptedMessage = await decryptData(newMessage);

        if (decryptedMessage?.type === "typing") {
          // Update typing status based on incoming event
          setIsTyping(decryptedMessage.is_typing);
        } else {
          // Avoid duplicate messages by checking if the new message already exists
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                msg.timestamp === decryptedMessage?.timestamp &&
                msg.content === decryptedMessage?.content
            );
            return isDuplicate ? prev : [...prev, decryptedMessage!];
          });
          }
      })();
    };


    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current = socket;
  };

  const sendMessage = async (content: string, image: string) => {
    if ((!content.trim() && image == "") || !socketRef.current) return;
    
    if (image == "") {
      image = " "
    } 
    const message: Message = {
      chat_id: chatID,
      type: "message",
      sender_id: sender?.id,
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

  const sendEncryptedMessage = async (content: string, image: string) => {
    if ((!content.trim() && image == "") || !socketRef.current) return;
    
    if (image == "") {
      image = " "
    } 
    const message: EncryptedMessage = {
      chat_id: chatID,
      type: "message",
      sender_id: sender?.id!,
      sender_name: sender?.username!,
      receiver_id: targetUser,
      content,
      image,
      timestamp: new Date().toISOString(),
      is_typing: false,
      classification_result: "",
    };

    const encryptedMessage = await encryptData(message)
    try {
      socketRef.current.send(JSON.stringify(encryptedMessage));
      console.log("Sending message:", JSON.stringify(encryptedMessage));

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
      sender_id: sender?.id,
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
          const response = await postEncryptMutation.mutateAsync({ 
            data : {
              content: data.content!,
              image: data.image,
              chat_id: data.chat_id!, 
              sender_id: data.sender_id!,
              type : data.type!,
              sender_name: data.sender_name!,
              receiver_id: data.receiver_id!,
              is_typing: data.is_typing,
              timestamp: data.timestamp!,
            }
          });

            console.log(response);
            return response
        } catch (error) {
            console.error('Error encrypting data:', error);
            return null;
        }
    };

    const decryptData = (data : EncryptedMessage) => {
        try {
            const response = postDecryptMutation.mutateAsync({ 
              data : {
                content: data.content!,
                image: data.image,
                image_to_classify: data.image_to_classify,
                chat_id: data.chat_id!, 
                sender_id: data.sender_id!,
                type : data.type!,
                sender_name: data.sender_name!,
                receiver_id: data.receiver_id!,
                is_typing: data.is_typing,
                timestamp: data.timestamp!,
                classification_result: data.classification_result!,
              }
            });
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
    sendEncryptedMessage,
    sendTypingEvent,
    socketStatus,
    socketRef,
    setupWebSocketConnection,
    isTypingMessage
  };
};

export { useMessagesAPI };

