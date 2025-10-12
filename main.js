/**
 * Lexia AI Agent Starter Kit
 * ==========================
 * 
 * A production-ready starter kit for building AI agents that integrate with the Lexia platform.
 * This demonstrates best practices for creating AI agents with proper memory management,
 * streaming responses, file processing, and function calling capabilities.
 * 
 * Key Features:
 * - Clean, maintainable architecture with separation of concerns
 * - Built-in conversation memory and thread management
 * - Support for PDF text extraction and image analysis
 * - Real-time response streaming via Lexia's infrastructure
 * - Function calling with DALL-E 3 image generation
 * - Robust error handling and comprehensive logging
 * - Inherited endpoints from Lexia package for consistency
 * - Dev mode for local development without Centrifugo
 * 
 * Architecture:
 * - Main processing logic in processMessage() function
 * - Memory management via ConversationManager class
 * - Utility functions for OpenAI integration
 * - Standard Lexia endpoints inherited from package
 * 
 * Usage:
 *     node main.js              # Production mode (Centrifugo)
 *     node main.js --dev        # Dev mode (no Centrifugo)
 *     node main.js --prod       # Force production mode
 *     
 *     # Or with environment variable:
 *     LEXIA_DEV_MODE=true node main.js
 * 
 * The server will start on http://localhost:5001 with the following endpoints:
 * - POST /api/v1/send_message - Main chat endpoint
 * - GET /api/v1/health - Health check
 * - GET /api/v1/ - Root information
 * - GET /api/v1/stream/{channel} - SSE stream (dev mode only)
 * - GET /api/v1/poll/{channel} - Polling endpoint (dev mode only)
 * 
 * Author: Lexia Team
 * License: MIT
 */

const OpenAI = require('openai');
const axios = require('axios');
const { encoding_for_model } = require('tiktoken');
const pdfParse = require('pdf-parse');

// Import Lexia components
const {
  LexiaHandler,
  Variables,
  createLexiaApp,
  addStandardEndpoints
} = require('@lexia/sdk');

// Import AI agent components
const { ConversationManager } = require('./memory');
const { formatSystemPrompt, formatMessagesForOpenAI } = require('./agent_utils');
const { getAvailableFunctions, processFunctionCalls } = require('./function_handler');

// Determine dev/prod mode from CLI flags or env var (default: prod)
let devModeFlag = null;
if (process.argv.includes('--dev')) {
  devModeFlag = true;
  console.log("🔧 Dev mode enabled via --dev flag");
} else if (process.argv.includes('--prod')) {
  devModeFlag = false;
  console.log("🚀 Production mode enabled via --prod flag");
} else {
  const envVal = (process.env.LEXIA_DEV_MODE || 'false').toLowerCase();
  devModeFlag = ['true', '1', 'yes', 'y', 'on'].includes(envVal);
  if (devModeFlag) {
    console.log("🔧 Dev mode enabled via LEXIA_DEV_MODE environment variable");
  }
}

// Initialize core services
const conversationManager = new ConversationManager(10);  // Keep last 10 messages per thread
const lexia = new LexiaHandler(devModeFlag);

// Create the Express app using Lexia's web utilities
const app = createLexiaApp({
  title: "Lexia AI Agent Starter Kit",
  version: "1.0.0",
  description: "Production-ready AI agent starter kit with Lexia integration"
});

/**
 * Process incoming chat messages using OpenAI and send responses via Lexia.
 * 
 * This is the core AI processing function that you can customize for your specific use case.
 * The function handles:
 * 1. Message validation and logging
 * 2. Environment variable setup
 * 3. OpenAI API communication
 * 4. File processing (PDFs, images)
 * 5. Function calling and execution
 * 6. Response streaming and completion
 * 
 * @param {Object} data - ChatMessage object containing the incoming message and metadata
 * @returns {Promise<void>} Responses are sent via Lexia's streaming and completion APIs
 * @throws {Error} If message processing fails (errors are sent to Lexia)
 * 
 * Customization Points:
 * - Modify system prompts and context
 * - Adjust OpenAI model parameters
 * - Add custom function calling capabilities
 * - Implement specialized file processing
 * - Customize error handling and logging
 */
async function processMessage(data) {
  try {
    // Log comprehensive request information for debugging
    console.log("=".repeat(80));
    console.log("📥 FULL REQUEST BODY RECEIVED:");
    console.log("=".repeat(80));
    console.log(`Thread ID: ${data.thread_id}`);
    console.log(`Message: ${data.message}`);
    console.log(`Response UUID: ${data.response_uuid}`);
    console.log(`Model: ${data.model}`);
    console.log(`System Message: ${data.system_message || 'Not provided'}`);
    console.log(`Project System Message: ${data.project_system_message || 'Not provided'}`);
    console.log(`Variables: ${JSON.stringify(data.variables || [])}`);
    console.log(`Stream URL: ${data.stream_url || 'Not provided'}`);
    console.log(`Stream Token: ${data.stream_token || 'Not provided'}`);
    console.log("=".repeat(80));
    
    // Log key processing information
    console.log(`🚀 Processing message for thread ${data.thread_id}`);
    console.log(`📝 Message: ${data.message.substring(0, 100)}...`);
    console.log(`🔑 Response UUID: ${data.response_uuid}`);
    
    // Get OpenAI API key using Variables helper class
    const vars = new Variables(data.variables);
    const openaiApiKey = vars.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      const missingKeyMsg = "Sorry, the OpenAI API key is missing or empty. From menu right go to admin mode, then agents and edit the agent in last section you can set the openai key.";
      console.error("OpenAI API key not found or empty in variables");
      await lexia.streamChunk(data, missingKeyMsg);
      await lexia.completeResponse(data, missingKeyMsg);
      return;
    }
    
    // Initialize OpenAI client and conversation management
    const client = new OpenAI({ apiKey: openaiApiKey });
    conversationManager.addMessage(data.thread_id, "user", data.message);
    const threadHistory = conversationManager.getHistory(data.thread_id);
    
    // Format system prompt and messages for OpenAI
    const systemPrompt = formatSystemPrompt(data.system_message, data.project_system_message);
    let messages = formatMessagesForOpenAI(systemPrompt, threadHistory, data.message);
    
    // Process PDF files if present
    if (data.file_type === 'pdf' && data.file_url) {
      console.log(`📄 PDF detected: ${data.file_url}`);
      
      try {
        // Download and process PDF content
        console.log("📥 Downloading PDF...");
        const response = await axios.get(data.file_url, { responseType: 'arraybuffer' });
        
        // Extract text from PDF using pdf-parse
        console.log("📖 Extracting text from PDF...");
        const pdfData = await pdfParse(response.data);
        const pdfText = pdfData.text;
        
        console.log(`📄 PDF text extracted. Length: ${pdfText.length} characters`);
        
        // Count tokens using tiktoken to prevent API overload
        console.log("🔢 Counting tokens with tiktoken...");
        const encoding = encoding_for_model("gpt-4");
        const tokens = encoding.encode(pdfText);
        const tokenCount = tokens.length;
        encoding.free();
        
        console.log(`🔢 Token count: ${tokenCount}`);
        
        // Add PDF content to the message for context
        if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
          const combinedContent = `${data.message}\n\nPDF Content:\n${pdfText}`;
          messages[messages.length - 1].content = combinedContent;
          
          console.log(`📤 PDF content added to OpenAI request. Total tokens: ${tokenCount}`);
        }
        
      } catch (error) {
        const errorMsg = `Error processing PDF: ${error.message}`;
        console.error(errorMsg, error);
        // Continue without PDF content if there's an error
      }
    }
    
    // Process image files if present
    else if (data.file_type === 'image' && data.file_url) {
      console.log(`🖼️ Image detected: ${data.file_url}`);
      // Add image to the last user message for vision analysis
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        messages[messages.length - 1].content = [
          { type: "text", text: messages[messages.length - 1].content },
          { type: "image_url", image_url: { url: data.file_url } }
        ];
        console.log("🖼️ Image added to OpenAI request for vision analysis");
      }
    }
    
    // Log OpenAI request details
    console.log(`🤖 Sending to OpenAI model: ${data.model}`);
    console.log(`💬 System prompt: ${systemPrompt.substring(0, 100)}...`);
    console.log(`📤 Messages being sent to OpenAI:`, JSON.stringify(messages, null, 2));
    
    // Get available functions from function handler
    const availableFunctions = getAvailableFunctions();
    
    // Stream response from OpenAI with function calling support
    const stream = await client.chat.completions.create({
      model: data.model,
      messages: messages,
      tools: availableFunctions,
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.7,
      stream: true
    });
    
    // Process streaming response
    let fullResponse = "";
    let usageInfo = null;
    const functionCalls = [];
    let generatedImageUrl = null;
    
    console.log("📡 Streaming response from OpenAI...");
    
    for await (const chunk of stream) {
      // Handle content chunks
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;
        // Stream chunk to Lexia (handles dev/prod mode internally)
        await lexia.streamChunk(data, content);
      }
      
      // Handle function call chunks
      if (chunk.choices[0]?.delta?.tool_calls) {
        console.log(`🔧 Tool call chunk detected:`, chunk.choices[0].delta.tool_calls);
        for (const toolCall of chunk.choices[0].delta.tool_calls) {
          if (toolCall.function) {
            // Initialize function call if it's new
            if (functionCalls.length <= toolCall.index) {
              functionCalls.push({
                id: toolCall.id,
                type: "function",
                function: {
                  name: toolCall.function.name,
                  arguments: ""
                }
              });
              console.log(`🔧 New function call initialized: ${toolCall.function.name}`);
              
              // Stream function call announcement to Lexia
              const functionMsg = `\n🔧 **Calling function:** ${toolCall.function.name}`;
              await lexia.streamChunk(data, functionMsg);
            }
            
            // Accumulate function arguments
            if (toolCall.function.arguments) {
              functionCalls[toolCall.index].function.arguments += toolCall.function.arguments;
              console.log(`🔧 Accumulated arguments for function ${toolCall.index}: ${toolCall.function.arguments}`);
              
              // Stream function execution progress to Lexia
              try {
                const currentArgs = functionCalls[toolCall.index].function.arguments;
                // Try to parse as JSON to show progress
                if (currentArgs.endsWith('"') || currentArgs.endsWith('}') || currentArgs.endsWith(']')) {
                  const parsedArgs = JSON.parse(currentArgs);
                  const progressMsg = `\n⚙️ **Function parameters:** ${JSON.stringify(parsedArgs, null, 2)}`;
                  await lexia.streamChunk(data, progressMsg);
                }
              } catch (parseError) {
                // JSON not complete yet, don't stream partial data
              }
            }
          }
        }
      }
      
      // Capture usage information from the last chunk
      if (chunk.usage) {
        usageInfo = chunk.usage;
        console.log(`📊 Usage info captured:`, usageInfo);
      }
    }
    
    console.log(`✅ OpenAI response complete. Length: ${fullResponse.length} characters`);
    
    // Process function calls if any were made using the function handler
    const { result: functionResult, fileUrl: generatedFileUrl } = await processFunctionCalls(functionCalls, lexia, data);
    if (functionResult) {
      fullResponse += functionResult;
    }
    if (generatedFileUrl) {
      generatedImageUrl = generatedFileUrl;
    }
    
    console.log(`🖼️ Final generated_image_url value: ${generatedImageUrl}`);
    
    // Store response in conversation memory
    conversationManager.addMessage(data.thread_id, "assistant", fullResponse);
    
    // Send complete response to Lexia with full data structure
    console.log("📤 Sending complete response to Lexia...");
    
    // Include generated image in the response if one was created
    if (generatedImageUrl) {
      console.log(`🖼️ Including generated image in API call: ${generatedImageUrl}`);
      // Use the completeResponse method that includes the file field
      await lexia.completeResponse(data, fullResponse, usageInfo, generatedImageUrl);
    } else {
      // Normal response without image
      await lexia.completeResponse(data, fullResponse, usageInfo);
    }
    
    console.log(`🎉 Message processing completed successfully for thread ${data.thread_id}`);
    
  } catch (error) {
    const errorMsg = `Error processing message: ${error.message}`;
    console.error(errorMsg, error);
    await lexia.sendError(data, errorMsg);
  }
}

// Add standard Lexia endpoints including the inherited send_message endpoint
// This provides all the standard functionality without additional code
addStandardEndpoints(app, {
  conversationManager: conversationManager,
  lexiaHandler: lexia,
  processMessageFunc: processMessage
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("🚀 Starting Lexia AI Agent Starter Kit...");
  console.log("=".repeat(60));
  
  // Display mode
  if (lexia.devMode) {
    console.log("🔧 DEV MODE ACTIVE - No Centrifugo required!");
    console.log("   Use --prod flag or LEXIA_DEV_MODE=false for production");
  } else {
    console.log("🟢 PRODUCTION MODE - Centrifugo/WebSocket streaming");
    console.log("   Use --dev flag or LEXIA_DEV_MODE=true for local development");
  }
  
  console.log("=".repeat(60));
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/v1/`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${PORT}/api/v1/send_message`);
  
  if (lexia.devMode) {
    console.log(`📡 SSE Stream: http://localhost:${PORT}/api/v1/stream/{channel}`);
    console.log(`📊 Poll Stream: http://localhost:${PORT}/api/v1/poll/{channel}`);
  }
  
  console.log("=".repeat(60));
  console.log("\n✨ This starter kit demonstrates:");
  console.log("   - Clean integration with Lexia package");
  console.log("   - Inherited endpoints for common functionality");
  console.log("   - Customizable AI message processing");
  console.log("   - Conversation memory management");
  console.log("   - File processing (PDFs, images)");
  console.log("   - Function calling with DALL-E 3");
  console.log("   - Proper data structure for Lexia communication");
  console.log("   - Comprehensive error handling and logging");
  
  if (lexia.devMode) {
    console.log("   - Dev mode streaming (SSE, no Centrifugo)");
  } else {
    console.log("   - Production streaming (Centrifugo/WebSocket)");
  }
  
  console.log("\n🔧 Customize the processMessage() function to add your AI logic!");
  console.log("\n💡 Mode Selection:");
  console.log("   node main.js --dev   # Local development (SSE streaming)");
  console.log("   node main.js --prod  # Production (Centrifugo)");
  console.log("=".repeat(60));
});

