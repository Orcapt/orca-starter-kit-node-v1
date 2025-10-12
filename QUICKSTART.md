# Quick Start Guide - Lexia AI Agent (Node.js)

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 14+ installed
- OpenAI API key
- npm or yarn

### Step 1: Install Dependencies
```bash
cd lexia-starter-kit-node-v1
npm install
```

### Step 2: Link Lexia SDK (Development)
```bash
# Go to lexia npm package
cd ../../lexia-sdk/lexia-npm
npm link

# Return to starter kit and link
cd ../../lexia-starter-kits/lexia-starter-kit-node-v1
npm link @lexia/sdk
```

### Step 3: Run the Agent
```bash
# Dev mode (recommended for testing)
npm run dev

# OR production mode
npm start
```

You should see:
```
🚀 Starting Lexia AI Agent Starter Kit...
============================================================
🔧 DEV MODE ACTIVE - No Centrifugo required!
============================================================
📖 API Documentation: http://localhost:5001/api/v1/
🔍 Health Check: http://localhost:5001/api/v1/health
💬 Chat Endpoint: http://localhost:5001/api/v1/send_message
============================================================
```

### Step 4: Test the Agent

#### Option 1: Health Check
```bash
curl http://localhost:5001/api/v1/health
```

#### Option 2: Send a Test Message
```bash
curl -X POST http://localhost:5001/api/v1/send_message \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "test-123",
    "message": "Hello! Tell me a joke.",
    "model": "gpt-4o",
    "response_uuid": "uuid-123",
    "message_uuid": "msg-123",
    "channel": "test-channel",
    "conversation_id": 1,
    "variables": [
      {"name": "OPENAI_API_KEY", "value": "sk-your-key-here"}
    ]
  }'
```

### Step 5: Run with Frontend (Optional)
```bash
# In a new terminal, start the Lexia frontend
npx lexia --port=3000 --agent-port=5001
```

Then open http://localhost:3000 in your browser!

## 📁 Project Structure

```
lexia-starter-kit-node-v1/
├── main.js                    # 🎯 Main application entry point
├── agent_utils.js             # 🛠️ Utility functions
├── function_handler.js        # 🎨 Function calling (DALL-E)
├── memory/                    # 💾 Conversation memory
│   ├── index.js
│   └── conversation_manager.js
├── package.json               # 📦 Dependencies
└── README.md                  # 📚 Full documentation
```

## 🔧 Customization

### Modify AI Behavior
Edit `main.js` → `processMessage()` function:

```javascript
async function processMessage(data) {
  // Your custom AI logic here
  const systemPrompt = "You are a helpful assistant...";
  // ...
}
```

### Add New Functions
Edit `function_handler.js` → `AVAILABLE_FUNCTIONS`:

```javascript
const AVAILABLE_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "your_new_function",
      description: "What your function does",
      parameters: {
        // Function parameters
      }
    }
  }
];
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in main.js or use environment variable
PORT=8000 npm run dev
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Key Issues
Make sure to include your OpenAI API key in the request:
```json
{
  "variables": [
    {"name": "OPENAI_API_KEY", "value": "sk-your-actual-key"}
  ]
}
```

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Check DEV_MODE_GUIDE.md** for local development tips
3. **Explore function_handler.js** to see DALL-E 3 integration
4. **Customize processMessage()** for your use case

## 🎯 Key Features

- ✅ Real-time streaming responses
- ✅ Conversation memory management
- ✅ PDF text extraction
- ✅ Image analysis (vision)
- ✅ DALL-E 3 image generation
- ✅ Dev mode (no Centrifugo needed)
- ✅ Production ready

## 💡 Tips

1. Use `npm run dev` for local development
2. Check console logs for detailed debugging
3. Test with curl before integrating with frontend
4. Use ngrok to expose local server for testing with Lexia platform

## 🆘 Need Help?

- Check the logs in the console
- Review README.md for full documentation
- Test endpoints with curl
- Verify API keys are correct

---

**Happy coding! 🚀**

Built with ❤️ by the Lexia Team

