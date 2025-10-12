/**
 * Conversation Manager for AI Agent Memory
 * =======================================
 * 
 * Manages conversation history and thread management for the AI agent.
 * This class provides a simple, in-memory conversation store that can be
 * easily extended to use databases, files, or other persistent storage.
 * 
 * Features:
 * - Thread-based conversation organization
 * - Configurable history limits per thread
 * - Automatic timestamp tracking
 * - Memory-efficient storage with automatic cleanup
 * - Easy extension for custom storage backends
 * 
 * Example:
 *     // Initialize with 20 message history limit
 *     const manager = new ConversationManager(20);
 *     
 *     // Add messages to different threads
 *     manager.addMessage("user_123", "user", "Hello, how are you?");
 *     manager.addMessage("user_123", "assistant", "I'm doing well, thank you!");
 *     manager.addMessage("user_456", "user", "What's the weather like?");
 *     
 *     // Get conversation history
 *     const history = manager.getHistory("user_123");
 *     // Returns: [{"role": "user", "content": "Hello, how are you?", "timestamp": "..."}, ...]
 *     
 *     // Check thread status
 *     const activeThreads = manager.getAllThreads();
 *     const threadCount = manager.getThreadCount();
 */

class ConversationManager {
  /**
   * Initialize the conversation manager.
   * 
   * @param {number} maxHistory - Maximum number of messages to keep per thread.
   *                              Older messages are automatically removed when this limit is exceeded.
   */
  constructor(maxHistory = 10) {
    this.maxHistory = maxHistory;
    this.conversations = new Map();
  }

  /**
   * Add a message to the conversation history.
   * 
   * This method automatically manages the conversation history by:
   * - Adding the new message with a timestamp
   * - Removing old messages if the thread exceeds maxHistory
   * - Creating the thread if it doesn't exist
   * 
   * @param {string} threadId - Unique identifier for the conversation thread
   * @param {string} role - Role of the message sender ("user" or "assistant")
   * @param {string} content - The message content/text
   * 
   * Example:
   *     manager.addMessage("user_123", "user", "Hello there!");
   *     manager.addMessage("user_123", "assistant", "Hi! How can I help you?");
   */
  addMessage(threadId, role, content) {
    if (!this.conversations.has(threadId)) {
      this.conversations.set(threadId, []);
    }

    const message = {
      role,
      content,
      timestamp: this._getTimestamp()
    };

    const threadHistory = this.conversations.get(threadId);
    threadHistory.push(message);

    // Maintain max history limit by removing oldest messages
    if (threadHistory.length > this.maxHistory) {
      threadHistory.shift();
    }
  }

  /**
   * Get conversation history for a specific thread.
   * 
   * @param {string} threadId - The thread identifier to retrieve history for
   * @returns {Array} List of message objects, each containing:
   *                  - role: "user" or "assistant"
   *                  - content: The message text
   *                  - timestamp: ISO format timestamp
   * 
   * Example:
   *     const history = manager.getHistory("user_123");
   *     for (const msg of history) {
   *       console.log(`${msg.role}: ${msg.content}`);
   *     }
   */
  getHistory(threadId) {
    return this.conversations.get(threadId) || [];
  }

  /**
   * Clear conversation history for a specific thread.
   * 
   * This completely removes all messages for the specified thread.
   * Useful for privacy concerns or starting fresh conversations.
   * 
   * @param {string} threadId - The thread identifier to clear
   * 
   * Example:
   *     manager.clearHistory("user_123");  // Removes all messages for user_123
   */
  clearHistory(threadId) {
    this.conversations.delete(threadId);
  }

  /**
   * Get all active conversation thread IDs.
   * 
   * @returns {Array<string>} List of all thread identifiers that currently have messages
   * 
   * Example:
   *     const activeThreads = manager.getAllThreads();
   *     console.log(`Active conversations: ${activeThreads.length}`);
   *     for (const threadId of activeThreads) {
   *       const history = manager.getHistory(threadId);
   *       console.log(`Thread ${threadId}: ${history.length} messages`);
   *     }
   */
  getAllThreads() {
    return Array.from(this.conversations.keys());
  }

  /**
   * Get the count of active threads.
   * 
   * @returns {number} Number of threads that currently have conversation history
   * 
   * Example:
   *     const count = manager.getThreadCount();
   *     console.log(`Managing ${count} conversation threads`);
   */
  getThreadCount() {
    return this.conversations.size;
  }

  /**
   * Get current timestamp for message tracking.
   * 
   * @returns {string} ISO format timestamp string
   * @private
   * 
   * Note:
   *     This is a private method used internally for timestamp generation.
   *     Override this method if you need custom timestamp formatting.
   */
  _getTimestamp() {
    return new Date().toISOString();
  }
}

module.exports = { ConversationManager };

