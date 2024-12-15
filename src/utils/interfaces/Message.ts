export interface Message {
    text?: string,
    date: string,
    attachment: {
        type: string,
        url: string,
    } | null,
    sender?: string,
    receiver?: string,
    owner?: string[]
}

export interface Message2 {
    id?: number,
    timestamp: string,
    sender_name?: string,
    sender_id?: number,
    receiver_id: number,
    content?: string
    chat_id: number
}
