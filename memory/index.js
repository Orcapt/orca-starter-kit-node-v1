/**
 * Memory Module for AI Agent
 * ==========================
 * 
 * Handles conversation memory and history management for the AI agent.
 * This module provides a clean, extensible way to manage conversation state
 * separate from the Lexia platform.
 * 
 * Features:
 * - Thread-based conversation management
 * - Configurable history limits
 * - Timestamp tracking for messages
 * - Easy extension for persistent storage
 * 
 * Usage:
 *     const { ConversationManager } = require('./memory');
 *     
 *     // Initialize with custom history limit
 *     const manager = new ConversationManager(20);
 *     
 *     // Add messages to a thread
 *     manager.addMessage("thread_123", "user", "Hello");
 *     manager.addMessage("thread_123", "assistant", "Hi there!");
 *     
 *     // Get conversation history
 *     const history = manager.getHistory("thread_123");
 */

const { ConversationManager } = require('./conversation_manager');

module.exports = {
  ConversationManager
};

