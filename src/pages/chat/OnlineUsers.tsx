import { Chat, IUser, User } from "hooks"
import React from "react"


interface UsersProp {
    users?: User[]
    chats?: Chat[]
    onClick?: (user: IUser) => void
    onClick2?: (user: User, chatID: number) => void
}

const OnlineUsers: React.FC<UsersProp> = (props) => {
    const {
        users,
        chats,
        onClick2
    } = props;

    return (
        <>
            {users && users.map((user, index) => {
                // Find the matching chatID for the user
                const chat = chats?.find(
                    (chat) => chat.user1_id === user.id || chat.user2_id === user.id
                );
                const chatID = chat ? chat.id : null;

                return (
                    <div
                        onClick={() => { 
                            if (onClick2 && chatID !== null) {
                                onClick2(user, chatID); 
                            }
                        }}
                        className={'flex flex-row gap-2 items-center py-2 rounded-md hover:bg-gray-200 cursor-pointer text-white '}
                        key={index}>
                        <div
                            className={'w-10 h-10 rounded-full bg-gray-300'}>
                            {user?.username ? (
                                <img
                                    referrerPolicy={'no-referrer'}
                                    alt={user?.username}
                                    className={'w-full h-full rounded-full'} />
                            ) : (
                                <div
                                    className={'w-full h-full rounded-full flex justify-center items-center'}>
                                    <span
                                        className={'text-2xl font-bold text-black'}>
                                        {user?.username?.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div
                            className={'flex flex-col gap-2 justify-between'}>
                            <h4
                                className={'text-base font-semibold'}>
                                {user?.username}
                            </h4>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export { OnlineUsers };
