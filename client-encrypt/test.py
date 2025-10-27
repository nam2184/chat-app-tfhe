import asyncio
import datetime
import json
import base64
import os
import random
import requests
import websockets

from preprocess import process_images_color
from serialiser import Network

network = Network()

# ==========================================================
# Encryption / Decryption Helpers
# ==========================================================

def encrypt_message(data):
    url = f"{network.local_encrypt_endpoint}/encrypt"
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()

def decrypt_message(data):
    url = f"{network.local_encrypt_endpoint}/decrypt"
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()

# ==========================================================
# Keep Alive Task
# ==========================================================

async def keep_alive(ws, interval=30):
    """Periodically send pings to keep the connection alive."""
    try:
        while True:
            await asyncio.sleep(interval)
            pong_waiter = await ws.ping()
            await asyncio.wait_for(pong_waiter, timeout=10)
            print("[KeepAlive] Ping successful")
    except asyncio.CancelledError:
        print("[KeepAlive] Cancelled")
    except Exception as e:
        print(f"[KeepAlive] Error: {e}")
        await ws.close()

# ==========================================================
# Dataset Helpers (unchanged)
# ==========================================================

def make_small_dataset(base_path, n_samples=100, seed=42):
    random.seed(seed)
    x_train, y_train = [], []
    for class_name in os.listdir(base_path):
        class_path = os.path.join(base_path, class_name)
        if not os.path.isdir(class_path):
            continue
        label = 0 if class_name.lower() in ["neutral", "drawings"] else 1
        images = [
            os.path.join(class_path, f)
            for f in os.listdir(class_path)
            if f.lower().endswith((".jpg", ".png"))
        ]
        for img in random.sample(images, min(len(images), n_samples // 2)):
            x_train.append(img)
            y_train.append(label)
    return x_train, y_train

def split_and_preprocess_calibration(base_path, n_samples=100, seed=42):
    calibration_data, classification = make_small_dataset(base_path, n_samples=n_samples, seed=seed)
    calibration_data_preprocessed = process_images_color(calibration_data)
    return calibration_data, calibration_data_preprocessed, classification

# ==========================================================
# Main Calibration Sender with Keep-Alive
# ==========================================================

async def send_calibration_over_ws(base_path, access_token, sender_id, sender_name, receiver_id, chat_id=1):
    ws_url = f"wss://khanhmychattypi.win/api/v1/ws/{chat_id}?access_token={access_token}"
    calibration_data, calibration_data_preprocessed, classification = split_and_preprocess_calibration(base_path)
    classes = ["false", "true"]
    log_path = "inference-logger.log"

    async with websockets.connect(
        ws_url,
        ping_interval=None,  # Disable built-in ping
        ping_timeout=None,
        max_size=None
    ) as ws:
        print("[INFO] Connected to WebSocket server.")

        keepalive_task = asyncio.create_task(keep_alive(ws, interval=45))

        try:
            with open(log_path, "a", encoding="utf-8") as log_file:
                for i, img in enumerate(calibration_data_preprocessed):
                    img_b64 = base64.b64encode(img).decode("utf-8")
                    raw_msg = {
                        "chat_id": chat_id,
                        "sender_id": sender_id,
                        "sender_name": sender_name,
                        "receiver_id": receiver_id,
                        "content": "",
                        "image": img_b64,
                        "type": "image",
                        "is_typing": False,
                        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                    }

                    encrypted_msg = encrypt_message(raw_msg)
                    await ws.send(json.dumps(encrypted_msg))
                    print(f"Sent encrypted sample {i+1}/{len(calibration_data_preprocessed)} — waiting for classification...")

                    # Wait for classification result
                    while True:
                        try:
                            response = await asyncio.wait_for(ws.recv(), timeout=120)
                            data = json.loads(response)

                            if "classification_result" not in data:
                                continue

                            decrypted = decrypt_message(data)
                            result = decrypted.get("classification_result", "Pending")

                            if result != "Pending":
                                log_entry = {
                                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                                    "image_index": i,
                                    "predicted_result": result,
                                    "actual_result": classes[classification[i]],
                                    "image_path": calibration_data[i],
                                }
                                log_file.write(json.dumps(log_entry) + "\n")
                                log_file.flush()
                                print(f"Received classification_result: {result}")
                                break
                        except asyncio.TimeoutError:
                            print("[WARN] Timeout waiting for classification — still connected.")
                        except websockets.ConnectionClosed as e:
                            print(f"[ERROR] Connection closed: {e}")
                            return
                        except Exception as e:
                            print(f"[ERROR] Unexpected error: {e}")
                            return

        finally:
            keepalive_task.cancel()
            print("[INFO] Connection closed and keepalive stopped.")

# ==========================================================
# Usage Example
# ==========================================================

if __name__ == "__main__":
    dataset_root = os.path.dirname(os.getcwd())
    access_token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5hbTIxODQiLCJ0cGUiOiJBY2Nlc3MgVG9rZW4iLCJpc3MiOiJhdXRoLXNlcnZpY2UiLCJzdWIiOiIxIiwiZXhwIjoxNzYxMTkxNTE4LCJpYXQiOjE3NjExMDUxMTh9.x7el6q_M8rB5Pu5Iy_n8_WSIhlKA6vdxn3CQIxIhqz6-fwdIkqqONRInL_2U_VKTHoPYhH3H79XYFIp7J18wZw"
    asyncio.run(send_calibration_over_ws(
        f"{dataset_root}/dataset",
        access_token,
        sender_id=1,
        sender_name="nam2184",
        receiver_id=2
    ))

