import { useContext, useEffect, useState } from "react"
import { User, useAuth } from "./useAuth"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db, api } from "utils"
import { AuthContext } from "contexts"

interface ChatInfo {
  chats: Chat[];
  users: User[];
}

interface Meta {
  total: number;
}

interface ResponseData {
  array: ChatInfo[];
  meta: Meta;
}

interface Chat {
    id: number
    user1_id: number
    user2_id: number
    seen: boolean
    last_message_time: string
    created_at: string
    updated_at: string
}

const useUsersAPI = () => {
    const [users, setUsers] = useState<User[]>([])
    const [chats, setChats] = useState<Chat[]>([])
    const [loading, setLoading] = useState(true)
    //const {userInfoAPI} = useContext(AuthContext)
  
    useEffect(() => {
            setLoading(true)
            
            const fetchUsers = async () => {
                try {
                    const response = await api.get<ResponseData>('/chats')
                    // Filter out the current user
                    setUsers(response.data.array[0].users)
                    setChats(response.data.array[0].chats)
                    setLoading(false)
                } catch (error) {
                    console.error('Failed to fetch users:', error)
                    setUsers([])
                    setChats([])
                    setLoading(false)
                }
            }

            fetchUsers()
    }, [])

    return { users, chats, loading }
}

export { useUsersAPI}
export type {Chat}
