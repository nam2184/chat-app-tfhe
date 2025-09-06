import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);let mainWindow;

function startPythonServer() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'client-encrypt', 'client.py');
    const process = spawn('python3', [scriptPath]);

    process.stdout.on('data', (data) => {
      console.log(`[PYTHON] ${data}`);
      if (data.toString().includes('Running on')) {
        resolve(process);  // assume Flask is ready
      }
    });

    process.stderr.on('data', (data) => {
      console.error(`[PYTHON ERROR] ${data}`);
    });

    process.on('error', reject);
  });
}

app.whenReady().then(async () => {
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Use `preload.js` for secure communication
      contextIsolation: true,
    },
  });
 
  startPythonServer()  
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173"); // Vite default
  } else {
    // Load built React files in production
    mainWindow.loadFile(path.join(__dirname, "ui", "dist", "index.html"));
  }

  //pythonProcess = await startPythonServer();
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  });
});


