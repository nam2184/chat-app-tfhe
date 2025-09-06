import { User } from "@/utils/interfaces";
import React, { useState, useEffect, useRef } from "react";
import { UserInput } from "./UserInput";
import styles from './styles/chat.module.css';
import { Message } from "@/utils";
import { useMessagesAPI } from "@/hooks";
import { MessageBox } from "./MessageBox";
import { useGetMessages } from "@/lib/kubb";
import { EncryptedMessage, getNormalKeysChatIdSuspense, useGetMessagesChatId, useGetNormalKeysChatId, useGetNormalKeysChatIdSuspense } from "@/lib/kubb-he";
import path from "path";
import fs from 'fs';

interface ConversationProps {
  sender?: User;
  reciever: User;
  chatID: number;
}

const Conversation: React.FC<ConversationProps> = ({ reciever, sender, chatID }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [offset, setOffset] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [encrypted, setEncrypted] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
 
  const getNormalKeys = useGetNormalKeysChatId(chatID);
  
  const checkFilesAndRequest = (chatID : number) => {
        try {
          useGetNormalKeysChatId(chatID).refetch();
          console.log(getNormalKeys)
        } catch (error) {
          console.error("Error sending request:", error);
        }
  };

  useEffect(() => {
    if (chatID) {
      checkFilesAndRequest(chatID);
    }
  }, [chatID]);

  const { sendMessage, sendEncryptedMessage, setupWebSocketConnection, sendTypingEvent, socketStatus, socketRef, isTypingMessage } = useMessagesAPI({
    sender: sender!,
    targetUser: reciever.id!,
    chatID,
    offset,
  });

  useEffect(() => {
    if (!reciever || !chatID) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    setupWebSocketConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [reciever, chatID]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getMessagesQuery = useGetMessages(chatID, {
        skip: offset,
        sort_by: "id",
        order_by: "DESC",
  }); 

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const api = getMessagesQuery;
      const { data } = await api.refetch({});

      const newMessages = data?.array!.reverse() || [];

      setMessages(prev => {
        const existing = new Set(prev.map(m => m?.timestamp! + m?.content!));
        const filtered = newMessages.filter(m => !existing.has(m?.timestamp! + m?.content!));
        return [...filtered, ...prev];
      });
      console.log(messages)
      setShouldScrollToBottom(false);
      setTotal(data?.meta?.total ?? 0);
    } catch (err) {
      console.error("Fetch messages failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !loading && total !== null && offset < total) {
      setOffset(prev => Math.min(prev + 10, total));
    }
  };

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    fetchMessages(); 
  }, [chatID]);

  useEffect(() => {
    if (offset === 0) return;
    fetchMessages();
  }, [offset]);
  
  useEffect(() => {
    if (shouldScrollToBottom && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldScrollToBottom]);

  useEffect(() => {
    if (!socketStatus) setOffset(0);
  }, [socketStatus]);

  const handleSubmitMessage = async () => {
    console.log("Reached here")
    if (!text.trim() && !image) return; 

    
    const now = Date.now();

    const optimisticMessage: EncryptedMessage = {
      content: text.trim(),
      image,
      chat_id: chatID,
      sender_id: sender?.id!,
      sender_name: sender?.username!,
      receiver_id: reciever.id!,
      type: image ? "image" : "text",
      is_typing: false,
      timestamp: now.toString(),
    };

    try {
      setMessages((prev) => [...prev, optimisticMessage]);

      await sendEncryptedMessage(text.trim(), image);

      setText('');
      setImage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };


  const isTyping = () => {
    if (typingTimeoutRef.current) return;
    sendTypingEvent(true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  return (
    <div className={'flex flex-col gap-2 min-h-screen'}>
      <header className={`flex flex-col gap-4 p-3 ${styles.header}`}>
        <div className={'flex flex-row bg-gray-100 gap-2 py-2 px-3 justify-between rounded-lg'}>
          <div className={'flex gap-2'}>
            <div className={'w-10 h-10 rounded-full bg-gray-300'}>
              {reciever?.username ? (
                <img referrerPolicy={'no-referrer'} alt={reciever.username} className={'w-full h-full rounded-full'} />
              ) : (
                <div className={'w-full h-full rounded-full flex justify-center items-center'}>
                  <span className={'text-2xl font-bold text-black'}>{reciever?.username?.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={'flex flex-col justify-between'}>
              <h4 className={'text-base font-semibold text-ellipsis line-clamp-1'}>{reciever?.username}</h4>
              <span className={'text-xs text-gray-500'}>{reciever?.created_at}</span>
            </div>
          </div>
          <button className="px-4 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded transition" onClick={() => setEncrypted(e => !e)}>
            {encrypted ? 'Disable Encryption' : 'Enable Encryption'}
          </button>
        </div>
      </header>

      <div
        className="flex flex-1 flex-col gap-2"
        ref={messageContainerRef}
        style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}
        onScroll={handleScroll}
      >
        {messages.map((msg, idx) => <MessageBox key={idx} message={msg} username={msg.sender_name} />)}

        {isTypingMessage && (
          <div className="flex items-center gap-1 px-4 h-6">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-[200ms]"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-[400ms]"></span>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <UserInput
        value={text}
        image={image}
        onChange={(val) => {
          setText(val);
          isTyping();
        }}
        onImageChange={(file) => {
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
            isTyping();
          };
          reader.readAsDataURL(file);
        }}
        onSubmit={handleSubmitMessage}
        key={reciever?.id}
      />
    </div>
  );
};

export { Conversation };

