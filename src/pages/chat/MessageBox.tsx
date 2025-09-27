import React from "react"
import dayjs from 'dayjs';
import { Message } from "@/lib/kubb";

interface MessageProp {
    message: Message
    username?: string
}

const MessageBox: React.FC<MessageProp> = (props) => {
    const { message, username } = props;

    // Decide blur logic
    const shouldBlur =
        message.classification_result === "Pending" ||
        message.classification_result === "true";

    // Ensure correct image source
    let imageSrc: string | undefined;
    if (message.image) {
        if (message.image.startsWith("data:image")) {
            imageSrc = message.image; // already prefixed
        } else {
            imageSrc = `data:image/png;base64,${message.image}`; // fallback default
        }
    }

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
                    <p className="mb-2 whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                )}

                {imageSrc && (
                    <img
                        src={imageSrc}
                        alt="Sent"
                        className={`rounded-lg object-contain max-w-full max-h-64 ${
                            shouldBlur ? "blur-sm" : ""
                        }`}
                    />
                )}
            </div>
        </div>
    );
};

export { MessageBox }

