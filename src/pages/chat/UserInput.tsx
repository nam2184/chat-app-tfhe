
import { Skeleton } from 'components'
import { EmojiClickData } from 'emoji-picker-react'
import { EmojiOutlined, MapPinOutlined, SendOutlined } from 'icons'
import React from 'react'
import { UserInputType, Message } from 'utils'

const EmojiPicker = React.lazy(() => import('emoji-picker-react'))
const LocationPicker = React.lazy(() => import('./LocationPicker').then(({ LocationPicker }) => ({ default: LocationPicker })))

interface UserInputProps {
    onSubmit?: (message: Message) => void,
    onChange?: (message: string) => void,
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void,
    value?: string
    placeholder?: string
    extras?: React.ReactNode
    children?: never[]
}


const UserInput: React.FC<UserInputProps> = (props) => {

    const [type, setType] = React.useState(UserInputType.TEXT)
    const [isShow, setIsShow] = React.useState(false)



    const handleOnClick = (currentType: UserInputType) => {
        if (currentType === type) {
            setIsShow(false)
            setType(UserInputType.TEXT)
        } else {
            setIsShow(true)
            setType(currentType)
        }
    }

    const handleClickEmoji = (emoji: EmojiClickData) => {
        props.onChange && props.onChange(props.value + emoji.emoji)
    }

    const handleOnEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') { 
            if (props.onSubmit) {
                props.onSubmit({
                    text: props.value,
                    date: new Date().toISOString(),
                    attachment: null
                })
            }
        }
    }


    return (
        <div
            className={'flex flex-col gap-2 p-3'}>
            <div
                className={'flex flex-col gap-2 p-2 bg-gray-100 rounded-xl'}>
                <div
                    className={'flex flex-row gap-2 bg-white items-center w-full rounded-xl'}>
                    <input
                        onKeyDown={handleOnEnterPress}
                        autoFocus={true}
                        placeholder={props.placeholder || 'Type a message...'}
                        onChange={(e) => { props.onChange && props.onChange(e.target.value) }}
                        value={props.value}
                        className={'flex-1 py-2 px-3 rounded-lg border-none focus:outline-none focus:border-none'} />
                    <button
                        className={`${type === UserInputType.EMOJI ? 'bg-spanishViolet-500' : ''} p-1 rounded-full`}
                        onClick={() => {
                            handleOnClick(UserInputType.EMOJI)
                        }}>
                        <EmojiOutlined
                            stroke={
                                type === UserInputType.EMOJI ? 'white' : 'currentColor'
                            } />
                    </button>
                    <button
                        className={`${type === UserInputType.LOCATION ? 'bg-spanishViolet-500' : ''} p-1 rounded-full`}
                        onClick={() => {
                            handleOnClick(UserInputType.LOCATION)
                        }}>
                        <MapPinOutlined
                            stroke={
                                type === UserInputType.LOCATION ? 'white' : 'currentColor'
                            } />
                    </button>
                    <button
                        className={'mr-2'}
                        onClick={() => {
                            if (props.onSubmit) {
                                props.onSubmit({
                                    text: props.value,
                                    date: new Date().toISOString(),
                                    attachment: null
                                })
                            }
                        }}>
                        <SendOutlined />
                    </button>
                </div>
                {
                    isShow && type === UserInputType.EMOJI ? (
                        <div
                            className={'flex flex-row gap-2 flex-wrap'}>
                            <React.Suspense fallback={<Skeleton avatar={false} />}>
                                <EmojiPicker
                                    onEmojiClick={handleClickEmoji}
                                    lazyLoadEmojis={true}
                                    width={'100%'} />
                            </React.Suspense>
                        </div>
                    ) : isShow && type === UserInputType.LOCATION ? (
                        <div>
                            <React.Suspense fallback={<Skeleton avatar={false} />}>
                                <LocationPicker
                                    onClick={(data) => {
                                        if (props.onSubmit) {
                                            props.onSubmit({
                                                text: data.address,
                                                date: new Date().toISOString(),
                                                attachment: {
                                                    type: UserInputType.LOCATION,
                                                    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${data.coordinates[1]},${data.coordinates[0]},15,0,0/300x300?access_token=${import.meta.env.VITE_APP_MAPBOX_API_KEY}`
                                                }
                                            })
                                            setType(UserInputType.TEXT)
                                        }
                                    }} />
                            </React.Suspense>
                        </div>
                    ) : null
                }
            </div>
        </div>
    )
}

export { UserInput }
