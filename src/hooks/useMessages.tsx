import { DocumentData, QuerySnapshot, addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore"
import React, { useCallback } from "react"
import { Message, db } from "utils"
import { IUser } from "./useAuth"

interface MessageProps {
    currentUser?: IUser,
    targetUser?: IUser
}

const useMessages = (props: MessageProps) => {

    const {
        currentUser,
        targetUser
    } = props

    const [messages, setMessages] = React.useState<Message[]>([])

    
    React.useEffect(() => {
        if (currentUser?.uid && targetUser?.uid) {
            const transformData = (snapshot: QuerySnapshot<DocumentData>) => {
                const data: Message[] = []
                snapshot.forEach((document) => {
                    const ref = document.data()
                    if ((ref.sender === currentUser?.uid && ref.receiver === targetUser.uid) || (ref.sender === targetUser.uid && ref.receiver === currentUser?.uid)) {
                        data.push(document.data() as Message)
                    }
                })
                setMessages(data)
            }
            const messageRef = collection(db, 'messages')
            const subscribtionSender = onSnapshot(messageRef, (snapshot) => {
                transformData(snapshot)
            })
          
            return () => {
                subscribtionSender()
            }
        } else {
            return () => {}
        }
    }, [currentUser?.uid, targetUser?.uid])

    /**
     * 
     * @param user IUser this is the user that is receiving the message
     * @param message the message that is being sent
     */
    const sendMessage = (user: IUser, message: Message) => {
        if (!message?.text)
            return
        if (message?.text.trim().length === 0) {
            return
        } else {
            const newMessage = {
                owner: [
                    user?.uid,
                    currentUser?.uid
                ],
                sender: currentUser?.uid,
                receiver: user?.uid,
                lastMessage: message.attachment ? message.attachment.type : message.text
            }
            const chatRef = collection(db, 'chats')
            setDoc(doc(chatRef), newMessage).then(() => {
                getDocs(chatRef).then(snapshot => {
                    snapshot.forEach(item => {
                        const data = item.data()
                        if ((data.sender === currentUser?.uid && data.receiver === user.uid) || (data.sender === user.uid && data.receiver === currentUser?.uid)) {
                            const messageRef = collection(db, 'chats', item.id, 'message')
                            addDoc(messageRef, {message}).then(() => {
                                console.log("message send")
                            })
                        }
                    })
                })
            }).catch((error) => {
                console.log(error)
            })
        }
    }

    return {
        sendMessage,
        messages
    }
}

export { useMessages }
