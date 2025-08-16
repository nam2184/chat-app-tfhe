import React from "react"
import { Message } from "@/utils"
import dayjs from 'dayjs';

interface MessageProp {
    message: Message
    username?: string
}

const MessageBox: React.FC<MessageProp> = (props) => {
    const { message, username } = props;

    return (
        <div className="flex flex-col bg-gray-100 p-3 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-700">{username}</span>
                <span className="text-xs text-gray-500">
                    {dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </span>
            </div>

            <div className="text-gray-800 text-sm">
                {message.content && (
                    <p className="mb-2 whitespace-pre-wrap break-words">{message.content}</p>
                )}

                {message.image && (
                    <img
                        src={message.image}
                        alt="Sent"
                        className="rounded-lg object-contain max-w-full max-h-64"
                    />
                )}
            </div>
        </div>
    );
};

export { MessageBox }

