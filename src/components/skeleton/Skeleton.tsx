import React from "react"

interface SkeletonProps {
    children?: never[]
    avatar?: boolean
}

const Skeleton: React.FC<SkeletonProps> = (props) => {

    const { avatar = true } = props

    return (
        <div className="rounded-md w-full mx-auto">
            <div className="animate-pulse flex space-x-4">
                {avatar && (
                    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                )}
                <div className="flex-1 space-y-6 py-1">
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                        </div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                </div>
            </div>
        </div>
    )
}

export { Skeleton }