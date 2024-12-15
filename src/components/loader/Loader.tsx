
const Loader = () => {

    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-row items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                    <div className="flex flex-col gap-2">
                        <div className="w-32 h-4 rounded-full bg-gray-300 animate-pulse"></div>
                        <div className="w-24 h-4 rounded-full bg-gray-300 animate-pulse"></div>
                        <div className="w-16 h-4 rounded-full bg-gray-300 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { Loader }