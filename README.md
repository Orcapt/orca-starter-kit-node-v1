# Lexia AI Agent Starter Kit (Node.js)

A clean, minimal example showing how to build AI agents that integrate with the Lexia platform using Node.js. This starter kit demonstrates best practices for creating AI agents with proper memory management, streaming responses, and file processing capabilities.

## ✨ Features

- **Clean Architecture**: Well-structured, maintainable code with clear separation of concerns
- **Memory Management**: Built-in conversation history and thread management
- **File Processing**: Support for PDF text extraction and image analysis
- **Streaming Responses**: Real-time response streaming via Lexia's infrastructure
- **Function Calling**: Built-in DALL-E 3 image generation capabilities with Lexia image markdown
- **Variables Helper**: Modern Variables class for clean API key and configuration management
- **Error Handling**: Robust error handling and logging throughout
- **Standard Endpoints**: Inherited endpoints from Lexia package for consistency
- **Dev Mode**: Local development mode with SSE streaming (no Centrifugo required)

## 🚀 Quick Start

### Prerequisites

- Node.js 14.0+
- npm or yarn
- OpenAI API key
- Access to Lexia platform

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xalantico/lexia-starter-kit-node-v1
   cd lexia-starter-kit-node-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Link the Lexia SDK (for development)**
   ```bash
   cd ../../lexia-sdk/lexia-npm
   npm link
   cd ../../lexia-starter-kits/lexia-starter-kit-node-v1
   npm link @lexia/sdk
   ```

4. **Run the starter kit**
   ```bash
   npm start
   ```

The server will start on `http://localhost:5001`

### Run Lexia Frontend locally

If you have Node.js installed, you can run the Lexia frontend without source code using the runner:

```bash
npx lexia --port=3000 --agent-port=5001
```

This serves the UI at `http://localhost:3000` and proxies API calls to your local agent at `http://localhost:5001`.

Uploads are available at `POST /api/upload` and files are served under `/uploads/*`.

## 📚 API Documentation

Once running, you can access:

- **Root Info**: `http://localhost:5001/api/v1/`
- **Health Check**: `http://localhost:5001/api/v1/health`
- **Chat Endpoint**: `http://localhost:5001/api/v1/send_message`

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lexia         │───▶│  Starter Kit     │───▶│   OpenAI        │
│  Platform       │    │                  │    │     API         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       ▲                        │                        │
       │                        ▼                        │
       │               ┌──────────────────┐               │
       │               │  Memory          │               │
       │               │  Manager        │               │
       │               └──────────────────┘               │
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                       ┌──────────────────┐
                       │  Response        │
                       │  Handler        │
                       └──────────────────┘
```

### Key Modules

- **`main.js`**: Main application entry point with AI processing logic
- **`memory/`**: Conversation history and thread management
- **`agent_utils.js`**: Utility functions for OpenAI integration
- **`function_handler.js`**: Function calling capabilities including DALL-E 3 image generation

## 🔧 Customization

### Modify AI Behavior

Edit the `processMessage()` function in `main.js` to customize:

- System prompts and context
- Model parameters (temperature, max_tokens, etc.)
- Response processing logic
- Error handling strategies

### Add New Capabilities

The starter kit includes function calling support. Add new functions by extending the `AVAILABLE_FUNCTIONS` array in `function_handler.js`:

```javascript
const AVAILABLE_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "your_function",
      description: "Description of what your function does",
      parameters: {
        type: "object",
        properties: {
          param1: { type: "string", description: "Parameter description" }
        },
        required: ["param1"]
      }
    }
  }
];
```

### Memory Management

Customize conversation storage in the `memory/` module:

- Adjust `maxHistory` for conversation length
- Implement persistent storage (database, files)
- Add conversation analytics and insights

## 📁 File Processing

The starter kit supports:

- **PDF Processing**: Automatic text extraction and token counting
- **Image Analysis**: Vision capabilities for image-based queries
- **File Size Limits**: Built-in token limits to prevent API overload

## 🔑 Configuration Management

### Variables Helper Class

The starter kit uses the modern Variables helper class from the Lexia package for clean configuration management:

```javascript
const { Variables } = require('@lexia/sdk');

// Initialize variables helper
const vars = new Variables(data.variables);

// Get API keys and configuration
const openaiKey = vars.get("OPENAI_API_KEY");
const customConfig = vars.get("CUSTOM_CONFIG");
const databaseUrl = vars.get("DATABASE_URL");

// Check if variable exists
if (vars.has("OPENAI_API_KEY")) {
  const key = vars.get("OPENAI_API_KEY");
}
```

### Benefits of Variables Helper

- **Clean API**: Object-oriented approach instead of utility functions
- **Better Performance**: Built-in caching for faster lookups
- **Flexible**: Easy to change variable names without code changes
- **Consistent**: Same pattern across all Lexia integrations

## 🖼️ Image Generation with Lexia Markdown

The starter kit includes DALL-E 3 image generation with Lexia's native image markdown functionality:

### How It Works

When generating images, the system automatically wraps the process with Lexia's image markdown tags:

```javascript
// Before image generation
await lexiaHandler.streamChunk(data, "[lexia.loading.image.start]");

// Generate image with DALL-E 3
const imageUrl = await generateImageWithDALLE(...);

// After image generation
await lexiaHandler.streamChunk(data, "[lexia.loading.image.end]");

// Include image URL in response
const imageResult = `Image URL: [lexia.image.start]${imageUrl}[lexia.image.end]`;
```

### Features

- **Automatic Markdown**: Images are automatically wrapped with Lexia image tags
- **Real-time Streaming**: Users see progress during image generation
- **Error Handling**: Graceful fallback if image generation fails
- **Customizable**: Easy to modify image parameters (size, quality, style)

## 🧪 Testing

### 1. Setup ngrok for External Access

To test your agent from the Lexia platform, you'll need to expose your local server to the internet using ngrok:

1. **Install ngrok**
   ```bash
   # On macOS with Homebrew
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your local server**
   ```bash
   npm start
   ```

3. **Expose your server with ngrok**
   ```bash
   ngrok http 5001
   ```

4. **Copy the ngrok URL**
   ngrok will display a URL like: `https://abc123.ngrok-free.app`

### 2. Configure Agent in Lexia Platform

1. Go to the [Lexia Platform](https://app.lexiaplatform.com)
2. Navigate to **Agents** → **Create New Agent**
3. In the **Agent Configuration** section:
   - Set **Agent Type** to "Custom Agent"
   - Set **Message Endpoint** to `https://abc123.ngrok-free.app/api/v1/send_message`
4. Save your agent configuration

### 3. Test Your Agent

Once configured, test your setup by sending a message through the Lexia platform or directly via curl:

```bash
curl -X POST "https://your-ngrok-url.ngrok-free.app/api/v1/send_message" \
     -H "Content-Type: application/json" \
     -d '{
       "thread_id": "test_thread",
       "message": "Hello, how are you?",
       "model": "gpt-4o",
       "response_uuid": "uuid-123",
       "message_uuid": "msg-123",
       "channel": "test-channel",
       "conversation_id": 1,
       "variables": [{"name": "OPENAI_API_KEY", "value": "sk-..."}]
     }'
```

**Note**: Replace `your-ngrok-url` with your actual ngrok URL. The ngrok URL will change each time you restart ngrok unless you have a paid account.

## 🐛 Troubleshooting

### Common Issues

1. **Module Not Found Errors**: Ensure all dependencies are installed correctly
   ```bash
   npm install
   ```

2. **API Key Issues**: The starter kit now provides helpful error messages when the OpenAI API key is missing:
   - "Sorry, the OpenAI API key is missing or empty. From menu right go to admin mode, then agents and edit the agent in last section you can set the openai key."
   - This guides users to the correct location in the Lexia platform to configure their API key

3. **Port Conflicts**: Change the port in `main.js` if 5001 is already in use:
   ```javascript
   const PORT = process.env.PORT || 5001;
   ```

4. **Variables Not Found**: Use the Variables helper class to access configuration values from Lexia requests

### Debug Mode

Enable detailed logging by setting the log level:

```javascript
// Add at the top of main.js
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${args.join(' ')}\n`);
};
```

## 📖 Code Structure

```
lexia-starter-kit-node-v1/
├── main.js                    # Main application entry point
├── package.json               # Dependencies and scripts
├── README.md                  # This file
├── DEV_MODE_GUIDE.md          # Dev mode documentation
├── lexiaNativeComponent.md    # Lexia native components guide
├── .gitignore                 # Git ignore patterns
├── memory/                    # Memory management module
│   ├── index.js
│   └── conversation_manager.js
├── agent_utils.js             # AI agent utilities
├── function_handler.js        # Function calling capabilities (DALL-E 3)
└── uploads/                   # File uploads directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This starter kit is provided as-is for development and educational purposes.

## 🆘 Support

For issues and questions:

1. Check the logs for detailed error messages
2. Review the Lexia platform documentation
3. Open an issue in this repository

---

**Happy coding! 🚀**

