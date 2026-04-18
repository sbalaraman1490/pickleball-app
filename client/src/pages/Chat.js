import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Dinkans AI assistant. How can I help you with pickleball rules, equipment, or community questions today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    checkOllamaStatus();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('/api/chat/status');
      const data = await response.json();
      setIsOllamaAvailable(data.available);

      if (!data.available) {
        setMessages([
          {
            role: 'assistant',
            content: `⚠️ ${data.provider} is not configured. ${data.hint || 'Please configure your API key.'}`
          }
        ]);
      }
    } catch (error) {
      console.error('Error checking chat status:', error);
      setIsOllamaAvailable(false);
      setMessages([
        {
          role: 'assistant',
          content: '⚠️ Unable to connect to chat service. Please check your configuration.'
        }
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get conversation history (excluding system message)
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationHistory
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}${data.hint ? '\n\n' + data.hint : ''}`
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hi! I\'m your Dinkans AI assistant. How can I help you with pickleball rules, equipment, or community questions today?'
      }
    ]);
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={28} />
            <div>
              <h1>Dinkans AI Assistant</h1>
              <p className="chat-subtitle">
                {isOllamaAvailable ? 'Powered by Groq' : 'Groq not configured'}
              </p>
            </div>
          </div>
          <div className="chat-actions">
            <button onClick={checkOllamaStatus} className="refresh-btn" title="Check Ollama Status">
              <RefreshCw size={18} />
            </button>
            <button onClick={clearChat} className="clear-btn" title="Clear Chat">
              Clear Chat
            </button>
          </div>
        </div>

        {!isOllamaAvailable && (
          <div className="ollama-warning">
            <AlertCircle size={20} />
            <div>
              <strong>Groq not configured</strong>
              <p>Please set the <code>GROQ_API_KEY</code> environment variable in your server configuration.</p>
              <p>Get your free API key from: <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer">console.groq.com</a></p>
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isOllamaAvailable || isLoading}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !isOllamaAvailable}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
