# Lexia Starter Kit - Dev Mode Guide (Node.js)

## Overview

The Lexia Starter Kit now supports **Dev Mode** for local development without requiring Centrifugo infrastructure.

## Running the Starter Kit

### Dev Mode (Local Development)
```bash
# Option 1: CLI flag
node main.js --dev

# Option 2: npm script
npm run dev

# Option 3: Environment variable
export LEXIA_DEV_MODE=true
node main.js
```

### Production Mode (Default)
```bash
# Option 1: Explicit flag
node main.js --prod

# Option 2: npm script
npm run prod

# Option 3: Default (no flags)
npm start

# Option 4: Environment variable
export LEXIA_DEV_MODE=false
node main.js
```

## What You'll See

### Dev Mode Output:
```
🚀 Starting Lexia AI Agent Starter Kit...
============================================================
🔧 DEV MODE ACTIVE - No Centrifugo required!
   Use --prod flag or LEXIA_DEV_MODE=false for production
============================================================
📖 API Documentation: http://localhost:5001/api/v1/
🔍 Health Check: http://localhost:5001/api/v1/health
💬 Chat Endpoint: http://localhost:5001/api/v1/send_message
📡 SSE Stream: http://localhost:5001/api/v1/stream/{channel}
📊 Poll Stream: http://localhost:5001/api/v1/poll/{channel}
============================================================

✨ This starter kit demonstrates:
   - Clean integration with Lexia package
   - Inherited endpoints for common functionality
   - Customizable AI message processing
   - Conversation memory management
   - File processing (PDFs, images)
   - Function calling with DALL-E 3
   - Proper data structure for Lexia communication
   - Comprehensive error handling and logging
   - Dev mode streaming (SSE, no Centrifugo)

🔧 Customize the processMessage() function to add your AI logic!

💡 Mode Selection:
   node main.js --dev   # Local development (SSE streaming)
   node main.js --prod  # Production (Centrifugo)
============================================================
```

### Production Mode Output:
```
🚀 Starting Lexia AI Agent Starter Kit...
============================================================
🟢 PRODUCTION MODE - Centrifugo/WebSocket streaming
   Use --dev flag or LEXIA_DEV_MODE=true for local development
============================================================
📖 API Documentation: http://localhost:5001/api/v1/
🔍 Health Check: http://localhost:5001/api/v1/health
💬 Chat Endpoint: http://localhost:5001/api/v1/send_message
============================================================

✨ This starter kit demonstrates:
   ... (features list)
   - Production streaming (Centrifugo/WebSocket)

💡 Mode Selection:
   node main.js --dev   # Local development (SSE streaming)
   node main.js --prod  # Production (Centrifugo)
============================================================
```

## Key Differences

| Feature | Dev Mode | Production Mode |
|---------|----------|-----------------|
| **Streaming** | SSE (Server-Sent Events) | Centrifugo WebSocket |
| **Response** | Direct HTTP stream | Background task + WebSocket |
| **Infrastructure** | None needed | Centrifugo server required |
| **Console Output** | ✅ Real-time | ❌ No |
| **Setup Complexity** | Low | Medium |
| **Best For** | Local testing | Production deployment |

## What Changed in the Code

### 1. Mode Detection
```javascript
// Determine dev/prod mode from CLI flags or env var (default: prod)
let devModeFlag = null;
if (process.argv.includes('--dev')) {
  devModeFlag = true;
} else if (process.argv.includes('--prod')) {
  devModeFlag = false;
} else {
  const envVal = (process.env.LEXIA_DEV_MODE || 'false').toLowerCase();
  devModeFlag = ['true', '1', 'yes', 'y', 'on'].includes(envVal);
}
```

### 2. LexiaHandler Initialization
```javascript
// Initialize with selected mode
const lexia = new LexiaHandler(devModeFlag);
```

### 3. Async/Await Pattern
```javascript
// Use async/await throughout for cleaner code
for await (const chunk of stream) {
  // Process streaming chunks
  await lexia.streamChunk(data, content);
}
```

## Testing Dev Mode

### 1. Start the Server
```bash
cd lexia-starter-kit-node-v1
npm install
npm run dev
```

### 2. Test with Frontend
Point your frontend to:
```
http://localhost:5001/api/v1/send_message
```

The response will stream in real-time!

### 3. Test Endpoints
```bash
# Health check
curl http://localhost:5001/api/v1/health

# API root
curl http://localhost:5001/api/v1/

# SSE stream (for a specific channel)
curl -N http://localhost:5001/api/v1/stream/your-channel-id

# Poll endpoint
curl http://localhost:5001/api/v1/poll/your-channel-id
```

## Features Working in Dev Mode

✅ **All features work identically in both modes:**
- ✅ Conversation memory
- ✅ PDF processing
- ✅ Image analysis (vision models)
- ✅ Function calling (DALL-E 3)
- ✅ Streaming responses
- ✅ Error handling
- ✅ Logging

**The only difference is HOW streaming is delivered to the frontend!**

## Upgrading from Previous Version

No code changes needed! Just update the Lexia SDK:

```bash
npm install @lexia/sdk@latest
```

Then you can use:
```bash
npm run dev   # New dev mode
npm start     # Same as before (production)
```

## Requirements

Make sure you have the latest version of @lexia/sdk:
```bash
npm install @lexia/sdk@latest
```

The @lexia/sdk package includes:
- DevStreamClient
- SSE endpoints
- Async queue support
- Dev mode support

## Troubleshooting

### Issue: "Cannot find module '@lexia/sdk'"
**Solution:** Install or link the package
```bash
npm install @lexia/sdk
# OR for development
cd ../../lexia-sdk/lexia-npm
npm link
cd ../../lexia-starter-kits/lexia-starter-kit-node-v1
npm link @lexia/sdk
```

### Issue: Streaming not working in dev mode
**Solution:** Make sure you're using `--dev` flag or set env var
```bash
node main.js --dev  # Should show "🔧 DEV MODE ACTIVE"
```

### Issue: Frontend still shows "Thinking..." then full response
**Solution:** Make sure frontend is parsing SSE format:
```javascript
// SSE format: "data: content\n\n"
const lines = buffer.split('\n\n');
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const chunk = line.substring(6);
    // Process chunk...
  }
}
```

## Examples

### Test with curl
```bash
# Send a message and watch it stream
curl -N -X POST http://localhost:5001/api/v1/send_message \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "test-123",
    "channel": "test-channel",
    "message": "Write a short poem about AI",
    "response_uuid": "uuid-123",
    "message_uuid": "msg-123",
    "conversation_id": 1,
    "model": "gpt-4o",
    "variables": [{"name": "OPENAI_API_KEY", "value": "sk-..."}],
    "url": "",
    "headers": {}
  }'
```

The `-N` flag makes curl show streaming output in real-time!

## Summary

**Dev Mode Benefits:**
- ✅ No infrastructure setup
- ✅ Real-time console output
- ✅ Easy testing
- ✅ Same code works in production

**To Use:**
1. Run with `--dev` flag or `npm run dev`
2. Frontend gets SSE streaming
3. See responses in console
4. When ready, remove `--dev` for production!

That's it! Happy developing! 🚀

