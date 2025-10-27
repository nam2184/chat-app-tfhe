import React, { useEffect } from "react";
import Layout from "./layout";
import { InferenceEvent, useGetUserSuspense } from "@/lib/kubb";
import { motion } from "framer-motion";
import { useInferenceEvents } from "@/hooks";

const QueueView: React.FC = () => {
  const userGet = useGetUserSuspense()
  const reciever = userGet.data
  const { inferenceEvents, setupWebSocketConnection, socketStatus, socketRef, isTypingMessage } = useInferenceEvents();
  
  useEffect(() => {
    if (!reciever)
    if (socketRef.current) {
      socketRef.current.close();
    }

    setupWebSocketConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [reciever]);
  
  return (
    <Layout>
      <main>
        <section className="auto-limit-w flex min-h-96 flex-col items-center justify-center gap-6">
          <h2 className="text-4xl font-bold">Inference Queue</h2>
        </section>

        <section className="auto-limit-w flex min-h-[600px] justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto p-2 w-full">
            {inferenceEvents.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className="overflow-hidden rounded-2xl shadow-md bg-gray-100 flex flex-col"
              >
                <div className="relative">
                  {/* Image with blur until finished */}
                  <img
                    src={`${msg.image}`}
                    alt={`Message ${msg.id}`}
                    className={`w-full h-64 object-cover transition-all duration-500 ${
                      msg.finished ? "blur-0" : "blur-md"
                    }`}
                  />

                  {/* Overlay while processing */}
                  {!msg.finished && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold">
                      Processing...
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export { QueueView };

