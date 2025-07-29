import React, { useState, useEffect, useRef } from 'react';

const BibleChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [agentId, setAgentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);
  const [createdObjects, setCreatedObjects] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Log API call
  const logApiCall = (method, endpoint, data, response) => {
    const call = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      data,
      response,
      id: Date.now()
    };
    setApiCalls(prev => [call, ...prev]);
  };

  // Initialize the Bible knowledge agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const requestData = {
          instructions: `You are a knowledgeable Bible study assistant. You help users understand Biblical teachings, parables, concepts, and principles. You can answer questions about:
          - Biblical stories and their meanings
          - Parables and their interpretations
          - Christian teachings and values
          - Biblical themes like forgiveness, love, hope, faith
          - Historical and cultural context of Biblical events
          
          Provide thoughtful, accessible explanations that help users understand Biblical wisdom and teachings. You don't need to cite specific chapter and verse references unless specifically asked. Focus on explaining the meaning and relevance of Biblical content in a warm, helpful manner.`,
          agent_name: "Bible Study Assistant"
        };

        console.log('API Call: POST /create-agent', requestData);

        const response = await fetch('https://builder.empromptu.ai/api_tools/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer d4c03a1f5c51feec3ce1bfe53f835fe4',
            'X-Generated-App-ID': 'd0ea2f75-e12e-4c9a-97f6-0014870a3154',
            'X-Usage-Key': '53fb7507b246072e7bd6cc437b147808'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        logApiCall('POST', '/create-agent', requestData, data);
        
        setAgentId(data.agent_id);
        setCreatedObjects(prev => [...prev, { type: 'agent', id: data.agent_id, name: 'Bible Study Assistant' }]);
        
        setMessages([{
          type: 'agent',
          content: "Hello! I'm your Bible Study Assistant. I'm here to help you explore Biblical teachings, understand parables, and discuss Christian principles. What would you like to learn about today?",
          timestamp: new Date().toISOString()
        }]);
      } catch (error) {
        console.error('Error initializing agent:', error);
        setMessages([{
          type: 'error',
          content: "Sorry, I'm having trouble starting up. Please refresh the page to try again.",
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAgent();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !agentId || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const userMsg = { 
      type: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const requestData = {
        agent_id: agentId,
        message: userMessage
      };

      console.log('API Call: POST /chat', requestData);

      const response = await fetch('https://builder.empromptu.ai/api_tools/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer d4c03a1f5c51feec3ce1bfe53f835fe4',
          'X-Generated-App-ID': 'd0ea2f75-e12e-4c9a-97f6-0014870a3154',
          'X-Usage-Key': '53fb7507b246072e7bd6cc437b147808'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      logApiCall('POST', '/chat', requestData, data);
      
      // Add agent response to chat
      setMessages(prev => [...prev, { 
        type: 'agent', 
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: "I'm sorry, I encountered an error. Please try your question again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteAllObjects = async () => {
    for (const obj of createdObjects) {
      if (obj.type === 'agent') {
        try {
          console.log(`API Call: DELETE /objects/${obj.id}`);
          const response = await fetch(`https://builder.empromptu.ai/api_tools/objects/${obj.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer d4c03a1f5c51feec3ce1bfe53f835fe4',
              'X-Generated-App-ID': 'd0ea2f75-e12e-4c9a-97f6-0014870a3154',
              'X-Usage-Key': '53fb7507b246072e7bd6cc437b147808'
            }
          });
          console.log(`Delete response for ${obj.id}:`, await response.text());
        } catch (error) {
          console.error(`Error deleting ${obj.id}:`, error);
        }
      }
    }
    setCreatedObjects([]);
    alert('All created objects have been deleted.');
  };

  // Chat panel component
  const ChatPanel = () => (
    <div 
      className={`
        ${isMobile && isExpanded ? 'chat-panel-mobile' : 'fixed bottom-4 right-4'}
        ${isExpanded ? (isMobile ? '' : 'w-96 h-[600px]') : 'w-80 h-16'}
        bg-white dark:bg-gray-800 
        rounded-2xl shadow-2xl 
        border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        z-50
        flex flex-col
      `}
      role="dialog"
      aria-label="Bible Study Chat Assistant"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-primary-600 text-white rounded-t-2xl cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">📖</span>
          </div>
          <span className="font-semibold">Bible Study Help</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDarkMode(!isDarkMode);
              }}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          )}
          <span className="text-xl transform transition-transform duration-300" style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Chat Content */}
      {isExpanded && (
        <>
          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {isInitializing ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Initializing...</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-2xl text-sm
                      ${message.type === 'user' 
                        ? 'chat-bubble-user text-white ml-4' 
                        : message.type === 'error'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mr-4'
                        : 'chat-bubble-agent text-white mr-4'
                      }
                      shadow-lg
                    `}
                    role={message.type === 'error' ? 'alert' : undefined}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl mr-4 flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Biblical teachings..."
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="2"
                disabled={isLoading || isInitializing}
                aria-label="Type your Bible question here"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || isInitializing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[48px]"
                aria-label="Send message"
              >
                <span className="text-lg">➤</span>
              </button>
            </div>
            
            {/* Example Questions */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">Try asking:</div>
              <div className="space-y-1">
                <div>"What does the Bible say about forgiveness?"</div>
                <div>"Explain the parable of the Good Samaritan"</div>
                <div>"What is the meaning of faith?"</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Main Content */}
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">
            Bible Study Chat Application
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Welcome to Your Bible Study Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click the chat widget in the bottom-right corner to start exploring Biblical teachings, 
              understanding parables, and discussing Christian principles with our AI assistant.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary-50 dark:bg-primary-900 p-6 rounded-xl">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-3">
                  What You Can Ask About:
                </h3>
                <ul className="space-y-2 text-primary-700 dark:text-primary-300 text-sm">
                  <li>• Biblical stories and their meanings</li>
                  <li>• Parables and their interpretations</li>
                  <li>• Christian teachings and values</li>
                  <li>• Themes like forgiveness, love, hope, faith</li>
                  <li>• Historical and cultural context</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900 p-6 rounded-xl">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                  Features:
                </h3>
                <ul className="space-y-2 text-green-700 dark:text-green-300 text-sm">
                  <li>• Conversational AI assistant</li>
                  <li>• Mobile-responsive design</li>
                  <li>• Dark mode support</li>
                  <li>• Accessible interface</li>
                  <li>• Real-time responses</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debug Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Debug Controls
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {showDebug ? 'Hide' : 'Show'} API Debug Info
              </button>
              
              <button
                onClick={deleteAllObjects}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={createdObjects.length === 0}
              >
                Delete All Objects ({createdObjects.length})
              </button>
            </div>

            {showDebug && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Created Objects:
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4">
                  {createdObjects.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No objects created yet</p>
                  ) : (
                    <ul className="space-y-1">
                      {createdObjects.map((obj, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          {obj.type}: {obj.name} (ID: {obj.id})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  API Call History:
                </h4>
                <div className="max-h-96 overflow-y-auto bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  {apiCalls.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No API calls yet</p>
                  ) : (
                    <div className="space-y-3">
                      {apiCalls.map((call) => (
                        <div key={call.id} className="border-b border-gray-300 dark:border-gray-600 pb-3">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {call.method} {call.endpoint}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {new Date(call.timestamp).toLocaleString()}
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                              View Details
                            </summary>
                            <div className="mt-2 space-y-2">
                              <div>
                                <strong>Request:</strong>
                                <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(call.data, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <strong>Response:</strong>
                                <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(call.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatPanel />
    </div>
  );
};

export default BibleChatApp;
