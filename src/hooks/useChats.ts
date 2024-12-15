import { collection, onSnapshot } from "firebase/firestore"
import React from "react"
import { db } from "utils"


interface IChat {
    id: string,
    receiverUid: string,
    senderUid: string,
}

const useChats = (props: {
    uid?: string | null
}) => {

    const [chats, setChats] = React.useState<IChat[]>([])
    const [loading, setLoading] = React.useState(true)


    React.useEffect(() => {
        const chatsRef = collection(db, "chats")
        setLoading(true)
        const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
            if (!props.uid) return
            const chatList = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    receiverUid: data.receiverUid,
                    senderUid: data.senderUid,
                }
            }).filter((chat) => {
                return chat.receiverUid === props.uid || chat.senderUid === props.uid
            })
            setChats(chatList)
            setLoading(false)
        })
        return () => {
            unsubscribe()
        }
    }, [])

    return {
        chats,
        loading,
    }

}

export { useChats }
export type { IChat }