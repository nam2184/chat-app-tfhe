import { User } from "@/utils/interfaces";
import React, { useState, useEffect, useRef } from "react";
import { UserInput } from "./UserInput";
import styles from './styles/chat.module.css';
import { Message } from "@/utils";
import { useMessagesAPI } from "@/hooks";
import { MessageBox } from "./MessageBox";
import { useGetEncryptedMessagesSuspense, useGetMessagesSuspense } from "@/lib/kubb";

interface ConversationProps {
  sender?: User;
  reciever: User;
  chatID: number;
}

const Conversation: React.FC<ConversationProps> = (props) => {
  const { reciever, sender, chatID } = props;
  const [text, setText] = useState<string>('');
  const [offset, setOffset] = useState<number>(0); 
  const [encrypted, setEncrypted] = useState(false);
  const [image, setImage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState<number | null | undefined>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const prevChatIDRef = useRef<number>();
  
  const { sendMessage, sendEncryptedMessage, sendTypingEvent, socketStatus, isTypingMessage } = useMessagesAPI({
    sender: sender!,
    targetUser: reciever.id!,
    chatID: chatID,
    offset: offset,
  });


  useEffect(() => {
    // Avoid calling fetchMessages if the chatID hasn't actually changed
    if (chatID !== prevChatIDRef.current) {
      fetchMessages(offset);
      prevChatIDRef.current = chatID;
    }
  }, [chatID, offset]);  
  
  useEffect(() => {
    if (!socketStatus) {
      console.log('Handling WebSocket disconnect state...');
      fetchMessages(offset); // Refetch messages
    }
  }, [socketStatus]);

  
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  let typingTimeout: NodeJS.Timeout | null = null;
  
  // Handle submit message
  const handleSubmitMessage = async (message: Message) => {
    if (reciever && (text.trim() || image)) {
      try {
        if (!encrypted) {
          console.log("Sending non encrypted message")
          await sendMessage(text.trim(), image);
        } else {
          console.log("Sending encrypted message")
          await sendEncryptedMessage(text.trim(), image);
        }
        setText('');
        setImage('');
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };


  const isTyping = (
    ) => {
      // Clear the timeout if it exists to reset the debounce
      if (typingTimeout) return;
      
      // Notify that the user is typing
      sendTypingEvent(true);

      // Set a new timeout to indicate "stopped typing" after 2 seconds of no input
      typingTimeout = setTimeout(() => {
        sendTypingEvent(false);
      }, 2000); // Adjust debounce delay as needed
  };
  
  const fetchMessages =  (offset : number) => {
      try {
        setLoading(true);
        const getMessages = useGetMessagesSuspense(chatID, {
          skip : offset,
          sort_by : "id",
          order_by: "DESC"
        });
        // Append new messages at the top of the list, while maintaining existing ones
        setMessages([
          ...getMessages.data?.array!.reverse(),
          ...messages,
        ]);
        setTotal(getMessages.data?.meta!.total);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

  const fetchMessagesEncrypted = (offset : number) => {
      try {
        setLoading(true);
        const getEncryptedMessages = useGetEncryptedMessagesSuspense(chatID, {
          skip : offset,
          sort_by : "id",
          order_by: "DESC"
        }); 
        // Append new messages at the top of the list, while maintaining existing ones
        setMessages([
          ...getEncryptedMessages.data?.array!.reverse(),
          ...messages,
        ]);
        setTotal(getEncryptedMessages.data?.meta!.total);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const top = container.scrollTop === 0; 
    const messagesPerRequest = 10; 
    const isNotLoading = !loading;

    const remainingMessages = Math.max(0, total! - offset); // Prevent negative remaining messages

    console.log('Remaining Messages:', remainingMessages);
    console.log('Is Not Loading:', isNotLoading);
    console.log('At the top:', top);

    if (top && isNotLoading && remainingMessages > 0) {
      const nextOffset = offset + messagesPerRequest;

      console.log('At the offset:', offset);
      const fetchMessagesAPI = () => {
        const newOffset = nextOffset <= total! ? nextOffset : offset + remainingMessages;
        setOffset(newOffset); // Update the offset

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

  useEffect(() => {
    if (!socketStatus) {
      setOffset(0)
    }
  }, [socketStatus]); // Trigger scroll to the bottom when messages change


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
              {reciever?.username ? (
                <img
                  referrerPolicy={'no-referrer'}
                  alt={reciever?.username}
                  className={'w-full h-full rounded-full'}
                />
              ) : (
                <div className={'w-full h-full rounded-full flex justify-center items-center'}>
                  <span className={'text-2xl font-bold text-black'}>
                    {reciever?.username?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className={'flex flex-col justify-between'}>
              {/* Name */}
              <h4 className={'text-base font-semibold text-ellipsis line-clamp-1'}>
                {reciever?.username}
              </h4>
              {/* Status */}
              <span className={'text-xs text-gray-500'}>{reciever?.created_at}</span>
            </div>
          </div>
          {/* Toggle Encryption */}
          <button
            className="px-4 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded transition"
            onClick={() => setEncrypted(prev => !prev)}
          >
            {encrypted ? 'Disable Encryption' : 'Enable Encryption'}
          </button>
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
        {messages.map((msg: Message, index: number) => {
          const username = msg.sender_name;
          return <MessageBox key={index} message={msg} username={username} />;
        })}
        {/* Typing Indicator */}
        {isTypingMessage && (
          <div className="flex items-center gap-1 px-4 h-6">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-[200ms]"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-[400ms]"></span>
          </div>
        )}
        {/* Scroll to the bottom of the messages */}
        <div ref={messageEndRef} />
      </div>

      {/* Chat input */}
      <div>
        <UserInput
          value={text}
          onChange={(value) => {
            setText(value);
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
    </div>
  );
};

export { Conversation };

