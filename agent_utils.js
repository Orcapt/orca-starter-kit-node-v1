/**
 * AI Agent Utilities
 * =================
 * 
 * Utility functions for the AI agent's OpenAI integration.
 * These functions handle the formatting and preparation of data for OpenAI API calls,
 * making it easy to customize system prompts and message formatting.
 * 
 * Features:
 * - System prompt formatting with project context
 * - OpenAI message format conversion
 * - Clean separation of prompt logic from main processing
 * - Easy customization for different use cases
 * 
 * Example:
 *     // Format system prompt with project context
 *     const systemPrompt = formatSystemPrompt(
 *       "You are a helpful AI assistant.",
 *       "This project is about customer support."
 *     );
 *     
 *     // Format messages for OpenAI API
 *     const messages = formatMessagesForOpenAI(
 *       systemPrompt,
 *       history,
 *       "How can I help you?"
 *     );
 */

/**
 * Format system prompt for OpenAI from agent's configuration.
 * 
 * This function combines the base system message with optional project-specific
 * context to create a comprehensive system prompt for the AI model.
 * 
 * @param {string|null} systemMessage - Base system message defining the AI's role and behavior.
 *                                      If null, uses a default helpful assistant prompt.
 * @param {string|null} projectSystemMessage - Additional project-specific context or instructions.
 *                                             This is appended to the base system message.
 * @returns {string} Formatted system prompt string ready for OpenAI API
 * 
 * Example:
 *     // Basic usage with default prompt
 *     const prompt = formatSystemPrompt();
 *     // Returns: "You are a helpful AI assistant."
 *     
 *     // With custom system message
 *     const prompt = formatSystemPrompt("You are a coding expert.");
 *     // Returns: "You are a coding expert."
 *     
 *     // With both system and project context
 *     const prompt = formatSystemPrompt(
 *       "You are a helpful AI assistant.",
 *       "This project is about customer support for a tech company."
 *     );
 *     // Returns: "You are a helpful AI assistant.\n\nProject Context: This project is about customer support for a tech company."
 */
function formatSystemPrompt(systemMessage = null, projectSystemMessage = null) {
  let basePrompt = "You are a helpful AI assistant.";
  
  if (systemMessage) {
    basePrompt = systemMessage;
  }
  
  if (projectSystemMessage) {
    basePrompt += `\n\nProject Context: ${projectSystemMessage}`;
  }
  
  return basePrompt;
}

/**
 * Format conversation history and current message for OpenAI API.
 * 
 * This function takes the system prompt, conversation history, and current
 * user message to create the proper message format expected by OpenAI's
 * chat completion API.
 * 
 * @param {string} systemPrompt - The formatted system prompt defining AI behavior
 * @param {Array<Object>} conversationHistory - List of previous conversation messages, each containing:
 *                                              - role: "user" or "assistant"
 *                                              - content: The message text
 *                                              - timestamp: Message timestamp (not used by OpenAI)
 * @param {string} currentMessage - The current user message to process
 * @returns {Array<Object>} List of message objects in OpenAI API format:
 *                          - role: "system", "user", or "assistant"
 *                          - content: The message content
 * 
 * Example:
 *     // Format messages for OpenAI
 *     const messages = formatMessagesForOpenAI(
 *       "You are a helpful assistant.",
 *       [
 *         {"role": "user", "content": "Hello", "timestamp": "..."},
 *         {"role": "assistant", "content": "Hi there!", "timestamp": "..."}
 *       ],
 *       "How are you today?"
 *     );
 *     
 *     // Result:
 *     // [
 *     //   {"role": "system", "content": "You are a helpful assistant."},
 *     //   {"role": "user", "content": "Hello"},
 *     //   {"role": "assistant", "content": "Hi there!"},
 *     //   {"role": "user", "content": "How are you today?"}
 *     // ]
 * 
 * Note:
 *     The timestamp field from conversation history is ignored as OpenAI
 *     doesn't use it. Only role and content are included in the API request.
 */
function formatMessagesForOpenAI(systemPrompt, conversationHistory, currentMessage) {
  // Start with system prompt
  const messages = [{ role: "system", content: systemPrompt }];
  
  // Add conversation history (excluding timestamp)
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  // Add current user message
  messages.push({ role: "user", content: currentMessage });
  
  return messages;
}

module.exports = {
  formatSystemPrompt,
  formatMessagesForOpenAI
};

