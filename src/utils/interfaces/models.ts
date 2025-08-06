export interface User {
    /**
     * @type string | undefined, date-time
     */
    created_at?: string;
    /**
     * @type string | undefined
     */
    email?: string;
    /**
     * @type string | undefined
     */
    first_name?: string;
    /**
     * @type integer | undefined, int64
     */
    id?: number;
    /**
     * @type string | undefined
     */
    surname?: string;
    /**
     * @type string | undefined
     */
    username?: string;
}

export interface Message {
    chat_id?: number;
    /**
     * @type string | undefined
     */
    content?: string;
    /**
     * @minLength 0
     * @type integer | undefined
     */
    id?: number;
    /**
     * @type string | undefined
     */
    image?: string;
    /**
     * @type boolean | undefined
     */
    is_typing?: boolean;
    /**
     * @minLength 0
     * @type integer | undefined
     */
    receiver_id?: number;
    /**
     * @minLength 0
     * @type integer | undefined
     */
    sender_id?: number;
    /**
     * @type string | undefined
     */
    sender_name?: string;
    /**
     * @type string | undefined, date-time
     */
    timestamp?: string;
    /**
     * @type string | undefined
     */
    type?: string;
}
