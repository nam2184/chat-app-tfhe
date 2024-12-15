import { User } from "hooks";
import React, { useState, useEffect, useRef } from "react";
import { UserInput } from "./UserInput";
import styles from './styles/chat.module.css';
import { Message2, Message } from "utils";
import { useMessagesAPI } from "hooks";
import { MessageBox } from "./MessageBox";

interface ConversationProps {
  sender?: User | null;
  user: User;
  chatID: number;
}

const Conversation: React.FC<ConversationProps> = (props) => {
  const { user, sender, chatID } = props;
  const [text, setText] = useState<string>('');
  const [offset, setOffset] = useState<number>(0); // Track the offset
  const { sendMessage, messages, total, loading, fetchMessages } = useMessagesAPI({
    sender: sender,
    targetUser: user,
    chatID: chatID,
    offset: offset,
  });

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle submit message
  const handleSubmitMessage = (message: Message) => {
    if (user) {
      sendMessage(text);
      setText('');
    }
  };

  // Handle scroll event to load older messages when reaching the top
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const top = container.scrollTop === 0; // Check if we're at the top of the container
    const messagesPerRequest = 10; // Number of messages loaded per request
    const isNotLoading = !loading;

    // Calculate remaining messages that can be loaded
    const remainingMessages = Math.max(0, total - offset); // Prevent negative remaining messages

    console.log('Remaining Messages:', remainingMessages);
    console.log('Is Not Loading:', isNotLoading);
    console.log('At the top:', top);

    if (top && isNotLoading && remainingMessages > 0) {
      const nextOffset = offset + messagesPerRequest;

      console.log('At the offset:', offset);
      // Fetch only remaining messages if they are less than the `messagesPerRequest`
      const fetchMessagesAPI = () => {
        const newOffset = nextOffset <= total ? nextOffset : offset + remainingMessages;
        setOffset(newOffset); // Update the offset

        // Call the function to load more messages, this can be a function like `fetchMessages` that gets the new batch of messages
        fetchMessages(newOffset);
      };

      fetchMessagesAPI(); // Call to load and append new messages
    }
  };

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Trigger scroll to the bottom when messages change

  // Scroll to the bottom when messages load
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={'flex flex-col gap-2 min-h-screen'}>
      <header className={`flex flex-col gap-4 p-3 ${styles.header}`}>
        <div className={'flex flex-row bg-gray-100 gap-2 py-2 px-3 justify-between rounded-lg'}>
          <div className={'flex gap-2'}>
            {/* Avatar */}
            <div className={'w-10 h-10 rounded-full bg-gray-300'}>
              {user?.username ? (
                <img
                  referrerPolicy={'no-referrer'}
                  alt={user?.username}
                  className={'w-full h-full rounded-full'}
                />
              ) : (
                <div className={'w-full h-full rounded-full flex justify-center items-center'}>
                  <span className={'text-2xl font-bold text-black'}>
                    {user?.username?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className={'flex flex-col justify-between'}>
              {/* Name */}
              <h4 className={'text-base font-semibold text-ellipsis line-clamp-1'}>
                {user?.username}
              </h4>
              {/* Status */}
              <span className={'text-xs text-gray-500'}>{user?.created_at}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat List */}
      <div
        className="flex flex-1 flex-col gap-2"
        ref={messageContainerRef}
        style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }} // Set a fixed height with vertical overflow
        onScroll={handleScroll}
      >
        {/* Render messages from most recent to oldest */}
        {messages.map((msg: Message2, index: number) => {
          const username = msg.sender_name;
          return <MessageBox key={index} message={msg} username={username} />;
        })}
        
        {/* Scroll to the bottom of the messages */}
        <div ref={messageEndRef} />
      </div>

      {/* Chat input */}
      <div>
        <UserInput
          value={text}
          onChange={(value) => {
            setText(value);
          }}
          onSubmit={handleSubmitMessage}
          key={user?.id}
        />
      </div>
    </div>
  );
};

export { Conversation };

