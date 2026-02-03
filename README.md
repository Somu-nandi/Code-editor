# Real-Time Collaborative Code Editor

A web-based real-time collaborative code editor with integrated AI assistant, supporting multiple programming languages and code execution.

## Features

- 🔄 **Real-Time Collaboration**: Multiple users can edit code simultaneously with instant synchronization
- 💻 **Multi-Language Support**: Python, Java, C, and C++ with syntax highlighting
- ▶️ **Code Execution**: Execute code directly in the browser with input/output support
- 🤖 **AI Assistant**: Integrated AI-powered coding assistant for code analysis and suggestions
- 🎨 **Modern UI**: Clean, intuitive interface with Monaco Editor

## Technology Stack

- **Frontend**: React 19, Monaco Editor, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **AI**: OpenRouter API integration

## Quick Start

### Prerequisites

- Node.js v18+
- Python 3.x
- Java JDK (for Java support)
- GCC (for C/C++ support)

### Installation

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Configure environment
cd backend
# Create .env file with:
# OPENROUTER_API_KEY=your-api-key-here

# Build frontend
npm run build

# Start server
npm start
```

The application will be available at `http://localhost:5000`

## Usage

1. Open the application in your browser
2. Enter a Room ID and your name
3. Click "Join Room"
4. Share the Room ID with others to collaborate
5. Write code, execute it, and get AI assistance

## Supported Languages

- Python
- Java
- C
- C++

## License

ISC

