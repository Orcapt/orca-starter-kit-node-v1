/**
 * Function Handler Module
 * ======================
 * 
 * This module handles all function calling capabilities for the Orca AI Agent.
 * It contains the function definitions, execution logic, and related utilities.
 * 
 * Key Features:
 * - DALL-E 3 image generation function
 * - Function schema definitions
 * - Function execution and error handling
 * - Streaming progress updates to Orca
 * 
 * Author: Orca Team
 * License: MIT
 */

const OpenAI = require('openai');
const { Variables } = require('@orcapt/sdk');

// Available functions schema for OpenAI
const AVAILABLE_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image using DALL-E 3 based on a text description",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A detailed description of the image you want to generate. Be specific about style, colors, composition, and mood."
          },
          size: {
            type: "string",
            enum: ["1024x1024", "1792x1024", "1024x1792"],
            description: "The size of the generated image. 1024x1024 is square, 1792x1024 is landscape, 1024x1792 is portrait."
          },
          quality: {
            type: "string",
            enum: ["standard", "hd"],
            description: "Image quality. HD is higher quality but costs more."
          },
          style: {
            type: "string",
            enum: ["vivid", "natural"],
            description: "Image style. Vivid is more dramatic, natural is more realistic."
          }
        },
        required: ["prompt"]
      }
    }
  }
];

/**
 * Generate an image using OpenAI's DALL-E 3 model.
 * 
 * This function demonstrates how to integrate external AI services with your agent.
 * You can extend this pattern to add other AI capabilities like speech synthesis,
 * video generation, or custom ML model inference.
 * 
 * @param {string} prompt - Detailed text description of the image to generate
 * @param {Array} variables - Variables array from request data
 * @param {string} size - Image dimensions - "1024x1024" (square), "1792x1024" (landscape), or "1024x1792" (portrait)
 * @param {string} quality - Image quality - "standard" or "hd" (higher cost but better quality)
 * @param {string} style - Image style - "vivid" (dramatic) or "natural" (realistic)
 * @returns {Promise<string>} URL of the generated image
 * @throws {Error} If image generation fails or API key is missing
 * 
 * Example:
 *     const imageUrl = await generateImageWithDALLE("A serene mountain landscape at sunset", variables);
 *     console.log(`Generated image: ${imageUrl}`);
 */
async function generateImageWithDALLE(prompt, variables = null, size = "1024x1024", quality = "standard", style = "vivid") {
  try {
    // Get OpenAI API key using Variables helper class
    if (!variables) {
      throw new Error("Variables not provided to generateImageWithDALLE");
    }
    
    const vars = new Variables(variables);
    const openaiApiKey = vars.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not found in variables");
    }
    
    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: openaiApiKey });
    
    console.log(`🎨 Generating image with DALL-E 3: ${prompt}`);
    
    // Generate image using DALL-E 3
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      quality: quality,
      style: style,
      n: 1
    });
    
    const imageUrl = response.data[0].url;
    console.log(`✅ Image generated successfully: ${imageUrl}`);
    
    return imageUrl;
    
  } catch (error) {
    const errorMsg = `Error generating image with DALL-E: ${error.message}`;
    console.error(errorMsg, error);
    throw new Error(errorMsg);
  }
}

/**
 * Execute a function call and return the result and any generated file URL.
 * 
 * @param {Object} functionCall - The function call object from OpenAI
 * @param {Object} orcaHandler - The Orca handler instance for streaming updates
 * @param {Object} data - The original chat message data
 * @returns {Promise<{result: string, fileUrl: string|null}>} Result message and generated file URL
 */
async function executeFunctionCall(functionCall, orcaHandler, data) {
  try {
    const functionName = functionCall.function.name;
    console.log(`🔧 Processing function: ${functionName}`);
    
    // Stream generic function processing start to Orca
    const processingMsg = `\n⚙️ **Processing function:** ${functionName}`;
    await orcaHandler.streamChunk(data, processingMsg);
    
    if (functionName === "generate_image") {
      return await executeGenerateImage(functionCall, orcaHandler, data);
    } else {
      const errorMsg = `Unknown function: ${functionName}`;
      console.error(errorMsg);
      return {
        result: `\n\n❌ **Function Error:** ${errorMsg}`,
        fileUrl: null
      };
    }
    
  } catch (error) {
    const errorMsg = `Error executing function ${functionCall.function.name}: ${error.message}`;
    console.error(errorMsg, error);
    const functionError = `\n\n❌ **Function Execution Error:** ${errorMsg}`;
    return {
      result: functionError,
      fileUrl: null
    };
  }
}

/**
 * Execute the generate_image function specifically.
 * 
 * @param {Object} functionCall - The function call object from OpenAI
 * @param {Object} orcaHandler - The Orca handler instance for streaming updates
 * @param {Object} data - The original chat message data
 * @returns {Promise<{result: string, fileUrl: string}>} Result message and generated image URL
 */
async function executeGenerateImage(functionCall, orcaHandler, data) {
  try {
    const args = JSON.parse(functionCall.function.arguments);
    console.log(`🎨 Executing DALL-E image generation with args:`, args);
    
    // Stream function execution start to Orca
    const executionMsg = `\n🚀 **Executing function:** generate_image`;
    await orcaHandler.streamChunk(data, executionMsg);
    
    // Stream image generation start markdown
    await orcaHandler.streamChunk(data, "[orca.loading.image.start]");
    
    // Generate the image using our DALL-E function
    const imageUrl = await generateImageWithDALLE(
      args.prompt,
      data.variables,
      args.size || "1024x1024",
      args.quality || "standard",
      args.style || "vivid"
    );
    
    console.log(`✅ DALL-E image generated: ${imageUrl}`);
    
    // Stream image generation end markdown
    await orcaHandler.streamChunk(data, "[orca.loading.image.end]");
    
    // Stream function completion to Orca
    const completionMsg = `\n✅ **Function completed successfully:** generate_image`;
    await orcaHandler.streamChunk(data, completionMsg);
    
    // Add image generation result to response
    const imageResult = `\n\n🎨 **Image Generated Successfully!**\n\n**Prompt:** ${args.prompt}\n**Image URL:** [orca.image.start]${imageUrl}[orca.image.end] \n\n*Image created with DALL-E 3*`;
    
    // Stream the image result to Orca
    await orcaHandler.streamChunk(data, imageResult);
    
    console.log(`✅ Image generation completed: ${imageUrl}`);
    
    return {
      result: imageResult,
      fileUrl: imageUrl
    };
    
  } catch (error) {
    const errorMsg = `Error executing generate_image function: ${error.message}`;
    console.error(errorMsg, error);
    const functionError = `\n\n❌ **Function Execution Error:** ${errorMsg}`;
    return {
      result: functionError,
      fileUrl: null
    };
  }
}

/**
 * Get the list of available functions for OpenAI.
 * 
 * @returns {Array} List of function schemas
 */
function getAvailableFunctions() {
  return AVAILABLE_FUNCTIONS;
}

/**
 * Process a list of function calls and return the combined result.
 * 
 * @param {Array} functionCalls - List of function call objects from OpenAI
 * @param {Object} orcaHandler - The Orca handler instance for streaming updates
 * @param {Object} data - The original chat message data
 * @returns {Promise<{result: string, fileUrl: string|null}>} Combined result message and generated file URL
 */
async function processFunctionCalls(functionCalls, orcaHandler, data) {
  if (!functionCalls || functionCalls.length === 0) {
    console.log("🔧 No function calls to process");
    return {
      result: "",
      fileUrl: null
    };
  }
  
  console.log(`🔧 Processing ${functionCalls.length} function calls...`);
  console.log("🔧 Function calls details:", JSON.stringify(functionCalls, null, 2));
  
  let combinedResult = "";
  let generatedFileUrl = null;
  
  for (const functionCall of functionCalls) {
    try {
      const { result, fileUrl } = await executeFunctionCall(functionCall, orcaHandler, data);
      combinedResult += result;
      
      if (fileUrl && !generatedFileUrl) {
        generatedFileUrl = fileUrl;
      }
      
    } catch (error) {
      const errorMsg = `Error processing function call: ${error.message}`;
      console.error(errorMsg, error);
      combinedResult += `\n\n❌ **Function Processing Error:** ${errorMsg}`;
    }
  }
  
  return {
    result: combinedResult,
    fileUrl: generatedFileUrl
  };
}

module.exports = {
  getAvailableFunctions,
  processFunctionCalls,
  generateImageWithDALLE
};

