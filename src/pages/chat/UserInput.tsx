import { Skeleton } from '@/components';
import { EmojiClickData } from 'emoji-picker-react';
import { EmojiOutlined, ImageOutlined, MapPinOutlined, SendOutlined } from '@/icons';
import React from 'react';
import { Message } from '@/utils';

enum UserInputType {
    TEXT = 'text',
    EMOJI = 'emoji',
    LOCATION = 'location',
    IMAGE = 'image',
}

const EmojiPicker = React.lazy(() => import('emoji-picker-react'));

interface UserInputProps {
    onSubmit?: (message: Message) => void;
    onChange?: (message: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onImageChange?: (file: File) => void;
    value?: string;
    image?: string;
    placeholder?: string;
    extras?: React.ReactNode;
    children?: never[];
}

const UserInput: React.FC<UserInputProps> = (props) => {
    const [type, setType] = React.useState(UserInputType.TEXT);
    const [isShow, setIsShow] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);


    const handleOnClick = (currentType: UserInputType) => {
        if (currentType === type) {
            setIsShow(false);
            setType(UserInputType.TEXT);
        } else {
            setIsShow(true);
            setType(currentType);
        }
    };

    const handleClickEmoji = (emoji: EmojiClickData) => {
        const current = props.value || '';
        props.onChange?.(current + emoji.emoji);
    };

    const handleSubmit = () => {
        props.onSubmit?.({
          content: props.value || '',
          image: props.image || '',
        });
    };

    const handleOnEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
        props.onKeyDown?.(event);
    };

    return (
        <div className="flex flex-col gap-1 p-2">
            <div className="flex flex-col gap-1 p-1 bg-gray-100 rounded-lg">
                <div className="flex flex-row gap-1  items-center w-full rounded-lg">
                    <input
                        onKeyDown={handleOnEnterPress}
                        autoFocus
                        placeholder={props.placeholder || 'Type a message...'}
                        onChange={(e) => props.onChange?.(e.target.value)}
                        value={props.value}
                        className="flex-1 py-1 px-2 text-sm rounded-md border-none focus:outline-none focus:ring-0"
                    />

                    <button
                        className="p-1 rounded-full bg-spanishViolet-500 text-black flex items-center justify-center w-10 h-10"
                        onClick={handleSubmit}
                    >
                        <SendOutlined />
                    </button>

                  <label className="p-1 rounded-full flex items-center justify-center cursor-pointer">
                        <ImageOutlined />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                props.onImageChange?.(file);
                                e.target.value = ""
                              }
                            }}
                            className="hidden"
                            onKeyDown={handleOnEnterPress}
                            autoFocus={true}
                        />
                    </label>
                    <button
                        className={`${
                            type === UserInputType.EMOJI ? 'bg-spanishViolet-500' : ''
                        } p-1 rounded-full flex items-center justify-center`}
                        onClick={() => handleOnClick(UserInputType.EMOJI)}
                    >
                        <EmojiOutlined
                            stroke={type === UserInputType.EMOJI ? 'white' : 'currentColor'}
                        />
                    </button>
                </div>

                {isShow && type === UserInputType.EMOJI && (
                    <div className="max-h-64 overflow-y-auto bg-white rounded-lg">
                        <React.Suspense fallback={<Skeleton avatar={false} />}>
                            <EmojiPicker
                                onEmojiClick={handleClickEmoji}
                                lazyLoadEmojis
                                width="100%"
                            />
                        </React.Suspense>
                    </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                    <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                    </div>
                )}
            </div>
        </div>
    );
};

export { UserInput };

