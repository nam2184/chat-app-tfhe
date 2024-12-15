import { GoogleAuthProvider, onAuthStateChanged, signInAnonymously, signInWithPopup, updateProfile } from "firebase/auth"
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { api, auth, db } from "utils"

interface IUser {
    displayName: string
    status: string | "online"
    uid: string
    createdAt: string,
    avatar?: string,
    email?: string
}

interface User {
    id: number;  // or int64 in TypeScript would be number
    first_name: string;
    surname: string;
    username: string;
    email: string;
    is_my: boolean;
    created_at: string;
    is_khanh: boolean;
}

const useAuth = () => {

    const [userInfo, setUserInfo] = useState<IUser | null>(null)
    const [userInfoAPI, setUserInfoAPI] = useState<User | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const signIn = async (displayName: string) => {
        return new Promise<IUser>((resolve, reject) => {
            signInAnonymously(auth).then((userCredential) => {
                const userRef = doc(db, "users", userCredential.user.uid)
                updateProfile(userCredential.user, {
                    displayName: displayName,
                }).then(() => {
                    setDoc(userRef, {
                        displayName: displayName,
                        uid: userCredential.user.uid,
                        createdAt: new Date().toISOString(),
                        status: "online",
                        avatar: userCredential.user.photoURL,
                        email: userCredential.user.email
                    }).then(() => {
                        getDoc(userRef).then((doc) => {
                            if (doc.exists()) {
                                setUserInfo(doc.data() as IUser)
                                resolve(doc.data() as IUser)
                            } else {
                                setUserInfo(null)
                            }
                        })
                    })
                })
            }).catch((error) => {
                reject(error)
            })
        })
    }
    
    
    const signInAPI = async (displayName: string, password: string): Promise<User> => {
      try {
          const response = await api.post('/auth', {
              username: displayName,
              password: password,
          });

          // Destructure the response data
          const { access_token, refresh_token, user } = response.data;

          // Save the tokens in localStorage (or you can use cookies if preferred)
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          setUserInfoAPI(user);
          console.log(userInfoAPI)
          return user;
      } catch (error) {
          console.error("Error signing in:", error);
          setUserInfoAPI(null)
          throw error;
      }
    };

    const signOut = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUserInfoAPI(null)
        window.location.href = '/'; 
    }

    const signInWithGoogle = (): Promise<boolean> => {
        const provider = new GoogleAuthProvider()
        return new Promise((resolve, reject) => {
            signInWithPopup(auth, provider).then((result) => {
                const user = result.user
                const userRef = doc(db, "users", user.uid)
                setDoc(userRef, {
                    displayName: user.displayName,
                    uid: user.uid,
                    createdAt: new Date().toISOString(),
                    status: "online",
                    avatar: user.photoURL,
                    email: user.email
                }).then(() => {
                    getDoc(userRef).then((doc) => {
                        if (doc.exists()) {
                            setUserInfo(doc.data() as IUser)
                            resolve(true)
                        } else {
                            setUserInfo(null)
                            resolve(false)
                        }
                    })
                })
            }).catch((error) => {
                setUserInfo(null)
                reject(error)
            })
        })
    }
    useEffect(() => {
        setLoading(true)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid)
                onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserInfo(doc.data() as IUser)
                        setLoading(false)
                    } else {
                        setLoading(false)
                        setUserInfo(null)
                    }
                })
            } else {
                setLoading(false)
                setUserInfo(null)
            }
        })

        return () => {
            unsubscribe()
        }
    }, [])

    return {
        userInfo,
        userInfoAPI,
        signIn,
        signInAPI,
        signOut,
        signInWithGoogle,
        loading
    }
}

export { useAuth }
export type { IUser, User }
