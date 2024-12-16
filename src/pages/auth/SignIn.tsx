import welcome from 'assets/welcome.svg'
import { Loader } from 'components'
import { AuthContext } from 'contexts'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

const SignIn: React.FC = () => {
    const navigate = useNavigate()

    const [username, setUsername] = React.useState<string>('')
    const [password, setPassword] = React.useState<string>('')
    const [loading, setLoading] = React.useState<boolean>(false)

    const { userInfoAPI, signInAPI, loading: authLoading } = useContext(AuthContext)

    const handleFormOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        if (username.length > 2) {
            signInAPI(username, password).then((user) => {
                setLoading(false)
                setUsername(user.username)
            })
        }
    }

    const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    React.useEffect(() => {
        if (userInfoAPI) {
            navigate('/chat')
        }
    }, [navigate, userInfoAPI])

    if (authLoading) {
        return <Loader />
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 ">
            <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen">
                {/* Left Section (Image and Welcome Message) */}
                {/* Right Section (Sign In Form) */}
                <section className="lg:w-1/2 flex flex-col gap-6 p-8 bg-black rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-white">Login ik</h2>
                    <p className="text-lg text-gray-100">Login google hok cos nen dung tam username password ik</p>
                    <form onSubmit={handleFormOnSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="username" className="text-lg text-gray-500">Login details</label>
                            <input
                                onChange={handleChangeUsername}
                                value={username}
                                required
                                placeholder="Enter your username"
                                type="text"
                                id="username"
                                name="username"
                                className="border-2 border-gray-300 rounded-lg p-3 text-gray-700 transition-all focus:outline-none focus:border-purple-500"
                            />
                            <input
                                onChange={handleChangePassword}
                                value={password}
                                required
                                placeholder="Enter your password"
                                type="password"
                                id="password"
                                name="password"
                                className="border-2 border-gray-300 rounded-lg p-3 text-gray-700 transition-all focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="bg-gray-500 text-white rounded-lg p-3 disabled:bg-gray-100 transition-all flex justify-center items-center"
                        >
                            {loading ? (
                                <svg
                                    aria-hidden="true"
                                    className="w-8 h-8 animate-spin"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 100 101"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>
                    <div className="flex flex-row gap-4 items-center justify-center mt-4">
                        <div className="border-b-2 border-gray-300 w-1/2" />
                        <p className="text-gray-500">or</p>
                        <div className="border-b-2 border-gray-300 w-1/2" />
                    </div>
                    <div className="flex flex-row gap-4 items-center justify-center mt-4">
                        <button className="p-2 bg-white rounded-lg flex flex-row gap-2 items-center shadow-md cursor-pointer">
                            <img
                                src="https://img.icons8.com/color/48/000000/google-logo.png"
                                alt="google"
                                className="w-6 h-6"
                            />
                            <p className="text-lg">Sign in with Google</p>
                        </button>
                    </div>
                </section>
            </div>
        </main>
    )
}

export { SignIn }

