# Chat Application TFHE

A secure, end-to-end encrypted chat application built with React, TypeScript, and Vite on the frontend, featuring homomorphic encryption powered by ConcreteML on the backend.

## Architecture

This application consists of three main components:

- **Frontend**: React + TypeScript + Vite application with Electron support
- **Chat Backend**: Python3 Flask API with Flask-SMOREST and Marshmallow
- **Client Encrypt Server**: Python3 ConcreteML-powered encryption service

The frontend uses Kubb for automatic API client generation, ensuring type-safe communication with both backend services.

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Kubb** - OpenAPI code generation
- **Electron** - Desktop application wrapper

### Backend
- **Python 3** - Runtime
- **Flask** - Web framework
- **Flask-SMOREST** - REST API framework
- **Marshmallow** - Schema validation and serialization
- **ConcreteML** - Homomorphic encryption library

## Prerequisites

- Node.js 20+
- Python 3.11+
- npm or yarn
- pip

## Installation

### Frontend Setup

```bash
# Install dependencies
npm install

# Generate API clients from OpenAPI specs
npm run kubb:generate
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-smorest marshmallow concrete-ml

# Start the chat backend
python app.py
```

### Encrypt Server Setup

```bash
# Navigate to encrypt server directory
cd client-encrypt

# Install dependencies
pip install requirements.txt

# Start the encryption server
python client.py
```

## Development

### Running the Application

#### Web Application
```bash
# Start the development server
npm run dev
```

#### Desktop Application (Electron)
```bash
# Run Electron app
npm run start
```

### API Client Generation

When the backend API schemas change, regenerate the TypeScript clients:

```bash
npm run kubb:generate
```

This will:
- Fetch OpenAPI specifications from both backend services
- Generate TypeScript types and API clients
- Update the frontend codebase with type-safe API methods

## Features

- **Real-time Chat**: WebSocket-based messaging
- **End-to-End Encryption**: ConcreteML homomorphic encryption
- **Type-Safe API**: Auto-generated TypeScript clients via Kubb
- **Cross-Platform**: Runs as web app or desktop app (Electron)
- **RESTful API**: Clean API design with Flask-SMOREST
- **Schema Validation**: Marshmallow schemas for data integrity

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ConcreteML for homomorphic encryption capabilities
- Flask-SMOREST for clean API architecture
- Kubb for seamless API client generation
