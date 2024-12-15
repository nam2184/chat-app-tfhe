import { useEffect, useState } from "react"
import { api } from "utils"
import { User } from "./useAuth"

const useUserAPI = () => {
    const [userInfo, setUser] = useState<User | null>() 
    //const {userInfoAPI} = useContext(AuthContext)
    useEffect(() => {
            const fetchUsers = async () => {
                try {
                    const response = await api.get<User>('/user')
                    // Filter out the current user
                    setUser(response.data)
                } catch (error) {
                    console.error('Failed to fetch users:', error)
                    setUser(null)
                }
            }

    
            fetchUsers()
    }, [])

    return { userInfo}
}

export { useUserAPI}
