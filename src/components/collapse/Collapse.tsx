import React, { useEffect } from 'react'

interface CollapseProps {
    collapsed?: boolean
    label?: string
    onCollapse?: (collapsed: boolean) => void
    children?: React.ReactNode
    animation?: {
        direction?: 'up' | 'down' | 'left' | 'right'
    }
}


const Collapse: React.FC<CollapseProps> = (props) => {

    const {
        collapsed = false,
        children,
        label,
        onCollapse,
    } = props

    const [collapse, setCollapse] = React.useState(collapsed)

    const divRef = React.useRef<HTMLDivElement>(null)

    const handleOnClick = () => {
        onCollapse && onCollapse(!collapsed)
        setCollapse(!collapse)
    }

    useEffect(() => {
        if (divRef.current && collapse) {
            divRef.current.style.height = '0px'

        } else if (divRef.current && !collapse) {
            divRef.current.style.height = `${divRef.current.scrollHeight}px`
        }
    }, [collapse, children])




    return (
        <div
            className={'flex flex-col gap-2'}>
            <div
                onClick={handleOnClick}
                className={'flex flex-row w-full justify-between items-center cursor-pointer relative z-10'}>
                <h2
                    className={'text-2xl font-bold text-black'}>
                    {label}
                </h2>
                <div>
                    {
                        collapse ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>

                        )
                    }
                </div>
            </div>
            <div
                style={{
                    height: !collapse ? '0px' : `${divRef.current?.scrollHeight}px`
                }}
                className={'transition-height duration-300 ease-in-out overflow-hidden'}
                ref={divRef}>{children}</div>
        </div>
    )
}

export { Collapse }
