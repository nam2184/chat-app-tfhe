import React, { useEffect, useState, useRef } from "react";
import Layout from "./layout";
import { motion } from "framer-motion";

interface EncryptionStats {
  uid: string;
  response_size: number;
  image_to_classify_size: number;
  encryption_time: number;
  memory_usage: number;
  ciphertext?: string; // base64
  plaintext?: string;  // base64
}

const ClientEncryptView: React.FC = () => {
  const [stats, setStats] = useState<EncryptionStats | null>(null);
  const socketRef = useRef<EventSource | null>(null);

  useEffect(() => {
    socketRef.current = new EventSource(`${import.meta.env.VITE_HE_BASE_URL}/logs/stream`); 

    socketRef.current.onmessage = (event) => {
      const data: EncryptionStats = JSON.parse(event.data);
      setStats(data);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // helper to safely render possibly incomplete base64
  const safeBase64 = (b64?: string) => {
    if (!b64) return "";
    try {
      return `data:image/png;base64,${b64}`;
    } catch {
      return "";
    }
  };

  return (
    <Layout>
      <main>
        <section className="auto-limit-w flex min-h-96 flex-col items-center justify-center gap-6">
          <h2 className="text-4xl font-bold">Encryption Stats</h2>
          {stats && (
            <div >
              <motion.div
                key={stats.uid}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-2xl shadow-md bg-gray-100 p-4 flex flex-col items-center"
              >
                <p><strong>UID:</strong> {stats.uid}</p>
                <p><strong>Response Size:</strong> {stats.response_size} bytes</p>
                <p><strong>Input Size:</strong> {stats.image_to_classify_size} bytes</p>
                <p><strong>Encryption Time:</strong> {stats.encryption_time.toFixed(3)} s</p>
                <p><strong>Memory Usage:</strong> {(stats.memory_usage / (1024 * 1024)).toFixed(2)} MB</p>

                {stats.plaintext && (
                  <>
                    <p className="mt-2 font-semibold">Plaintext:</p>
                    <img
                      src={stats.plaintext}
                      alt="Plaintext"
                      className="w-full h-48 object-contain bg-gray-200"
                    />
                  </>
                )}

                {stats.ciphertext && (
                  <>
                    <p className="mt-2 font-semibold">Ciphertext:</p>
                    <img
                      src={safeBase64(stats.ciphertext)}
                      alt="Ciphertext"
                      className="w-full h-48 object-contain bg-gray-200"
                    />
                  </>
                )}
              </motion.div>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export { ClientEncryptView };

