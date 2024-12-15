import { useEffect, useState } from "react"
import { IUser, User, useAuth } from "./useAuth"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "utils"


const useUsers = () => {
    const [users, setUsers] = useState<IUser[]>([])
    const [nusers, setnUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const { userInfo } = useAuth()

    useEffect(() => {
        if (userInfo?.uid) {
            setLoading(true)
            const userRef = query(collection(db, "users"), where("status", "==", "online"))
            const unsubscribe = onSnapshot(userRef, (snapshot) => {
                const sn = snapshot.docs.map((doc) => ({
                    uid: doc.id,
                    displayName: doc.data().displayName,
                    photoURL: doc.data().photoURL,
                    status: doc.data().status,
                    createdAt: doc.data().createdAt,
                    avatar: doc.data().avatar,
                }))
                const filteredUsers = sn.filter((user) => user.uid !== userInfo.uid)
                setUsers(filteredUsers as IUser[])
                setLoading(false)
            })
            return () => {
                setLoading(false)
                unsubscribe()
            }
        } else {
            setLoading(true)
            return () => { 
                setLoading(false)
            }
        }
    }, [userInfo?.uid])

    return { users, loading }
}

export { useUsers }
