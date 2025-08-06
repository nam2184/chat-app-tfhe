import { useContext, useEffect, useState } from "react"
import { heApi, Message2 } from "utils"

interface Meta {
  total: number;
}

interface Chat {
    id: number
    user1_id: number
    user2_id: number
    seen: boolean
    last_message_time: string
    created_at: string
    updated_at: string
}

const useHEAPI = () => {
    const [encrypted, setEncrypted] = useState<boolean>(false);
    const [decrypted, setDecrypted] = useState<boolean>(false);
    
    const encryptData = async (data : Message2) => {
        try {
            const response = await heApi.post("/encrypt", { data });
            setEncrypted(true);
            console.log(response);
            return response.data;
        } catch (error) {
            console.error('Error encrypting data:', error);
            return null;
        }
    };

    const decryptData = async (encryptedData : Message2[]) => {
        try {
            const response = await heApi.post("/decrypt", { encryptedData });
            setDecrypted(true);
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    };
    return { encrypted, decrypted, encryptData, decryptData };
};
export default useHEAPI;

