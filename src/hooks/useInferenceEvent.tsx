import React, { useState, useRef } from "react";
import { User, api } from "@/utils";
import {  InferenceEvent, Message } from "@/lib/kubb"
import { EncryptedMessage, usePostDecrypt, usePostEncrypt } from "@/lib/kubb-he";


const useInferenceEvents = () => {
  const [inferenceEvents, setInferenceEvents] = useState<InferenceEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState<boolean>(false); // Track WebSocket status
  const [isTypingMessage, setIsTyping] = useState<boolean | undefined>(false);
  
  
  const setupWebSocketConnection = async () => {
    const accessToken = localStorage.getItem("access_token");
    const socket = new WebSocket(`wss://khanhmychattypi.win/api/v1/ws/view?access_token=${accessToken}`);

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
      const newMessage: InferenceEvent = JSON.parse(event.data);

      (async () => {
        if (newMessage?.type === "typing") {
          setIsTyping(newMessage.is_typing);
          return;
        }

        setInferenceEvents((prev) => {
          // If finished, remove from list
          if (newMessage.finished) {
            return prev.filter((msg) => msg.id !== newMessage.id);
          }

          // If not finished, add/update in list
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) {
            return prev.map((msg) =>
              msg.id === newMessage.id ? newMessage : msg
            );
          } else {
            return [...prev, newMessage];
          }
        });
      })();
    };


    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current = socket;
  };

  
  return {
    inferenceEvents,
    socketStatus,
    socketRef,
    setupWebSocketConnection,
    isTypingMessage
  };
};

export { useInferenceEvents };

