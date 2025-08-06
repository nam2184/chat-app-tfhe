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
            {/* Message Header */}
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-700">{username}</span>
                <span className="text-xs text-gray-500">
               <span className="text-xs text-gray-500">
                {dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </span>
              </span>
            </div>
            {/* Message Body */}
            <div className="text-gray-800 text-sm">
                {message.content}
            </div>
        </div>
    )
}

export { MessageBox }

