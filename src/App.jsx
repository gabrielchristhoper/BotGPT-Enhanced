import React, { useState, useRef, useEffect } from 'react'
import "./App.css"
import "./chat-messages.css"
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ConfirmDialog from './components/ConfirmDialog'
import MessageActions from './components/MessageActions'
import EditableMessage from './components/EditableMessage'
import SearchModal from './components/SearchModal'
import { BeatLoader } from "react-spinners";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { RiComputerFill } from "react-icons/ri";
import { GiOpenBook, GiWhiteBook } from 'react-icons/gi';
import { FaBloggerB } from 'react-icons/fa';

const App = () => {
  const [screen, setScreen] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  let messages = [];

  const [data, setData] = useState(messages);

  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Dialog state management
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });



  // Edit mode state
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);

  // Scroll management
  const chatContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  async function getResponse(customPrompt = null, isEdit = false) {
    const currentPrompt = customPrompt || prompt;

    if (currentPrompt === "") {
      alert("Silakan masukkan pertanyaan!");
      return;
    }

    // Only add user message if it's not an edit
    if (!isEdit) {
      setData(prevData => [...prevData, { role: "user", content: currentPrompt }])
    }
    setScreen(2);
    setLoading(true);

    try {
      if (import.meta.env.DEV) {
        console.log("API Key:", import.meta.env.VITE_OPENROUTER_API_KEY ? "Present" : "Missing");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "z-ai/glm-4.5-air:free",
          "messages": [
            {
              "role": "user",
              "content": currentPrompt
            }
          ]
        })
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (import.meta.env.DEV) {
        console.log("API Response:", result);
      }

      if (result.choices && result.choices[0] && result.choices[0].message) {
        const aiResponse = result.choices[0].message.content;
        const responseTimestamp = Date.now();
        setData(prevData => {
          const newData = [...prevData, { role: "ai", content: aiResponse, timestamp: responseTimestamp }];

          // Save to history if this is a new chat (first response)
          setTimeout(() => {
            if (!currentChatId && newData.length === 2) {
              saveChatToHistory(newData);
            } else if (currentChatId) {
              // Update existing chat
              saveChatToHistory(newData, currentChatId);
            }
          }, 0);

          return newData;
        });
      } else {
        if (import.meta.env.DEV) {
          console.error("Unexpected response format:", result);
        }
        setData(prevData => [...prevData, { role: "ai", content: "Maaf, format respons dari API tidak terduga.", timestamp: Date.now() }])
      }
    } catch (error) {
      console.error("Error:", error);
      setData(prevData => [...prevData, { role: "ai", content: `Kesalahan: ${error.message}`, timestamp: Date.now() }])
    }

    setPrompt("");
    setLoading(false);
  }

  const handleExampleClick = (questionText) => {
    setPrompt(questionText);
    getResponse(questionText);
  }

  const toggleSidebar = () => {
    // Store current scroll position before sidebar state change
    if (chatContainerRef.current) {
      setScrollPosition(chatContainerRef.current.scrollTop);
    }

    setSidebarOpen(!sidebarOpen);
  }

  // Effect to manage scroll position during sidebar transitions
  useEffect(() => {
    if (chatContainerRef.current && scrollPosition > 0) {
      // Restore scroll position after sidebar transition with smooth adjustment
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = scrollPosition;
        }
      }, 100); // Small delay to ensure layout is updated

      return () => clearTimeout(timer);
    }
  }, [sidebarOpen, scrollPosition]);

  // Chat history management functions
  const generateChatTitle = (firstMessage) => {
    return firstMessage.length > 50
      ? firstMessage.substring(0, 50) + "..."
      : firstMessage;
  }

  const saveChatToHistory = (messages, chatId = null) => {
    if (messages.length === 0) return;

    const id = chatId || Date.now().toString();
    const title = generateChatTitle(messages[0].content);

    // For determining the timestamp, use the last AI message timestamp if available
    let timestamp;
    let createdAt;

    if (chatId) {
      // For existing chats, find the last AI message timestamp
      const lastAiMessage = [...messages].reverse().find(msg => msg.role === "ai");
      if (lastAiMessage && lastAiMessage.timestamp) {
        timestamp = lastAiMessage.timestamp;
        createdAt = new Date(timestamp).toLocaleDateString();
      } else {
        // If no AI message with timestamp found, preserve existing createdAt or use current time
        const existingChat = chatHistory.find(chat => chat.id === chatId);
        if (existingChat) {
          timestamp = existingChat.timestamp;
          createdAt = existingChat.createdAt;
        } else {
          timestamp = Date.now();
          createdAt = new Date(timestamp).toLocaleDateString();
        }
      }
    } else {
      // For new chats, use current timestamp
      timestamp = Date.now();
      createdAt = new Date(timestamp).toLocaleDateString();
    }

    const chatData = {
      id,
      title,
      messages,
      timestamp,
      createdAt
    };

    const updatedHistory = [chatData, ...chatHistory.filter(chat => chat.id !== id)];
    setChatHistory(updatedHistory);
    setCurrentChatId(id);

    // Save to localStorage
    try {
      localStorage.setItem('botgpt-chat-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }

    return id;
  }

  const loadChatFromHistory = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setData(chat.messages);
      setCurrentChatId(chatId);
      setScreen(2); // Switch to chat screen
    }
  }

  // Load chat history from localStorage on component mount
  React.useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('botgpt-chat-history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to toggle search modal (open/close)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Scroll position management for sidebar state changes
  React.useEffect(() => {
    const handleSidebarChange = () => {
      const scrollContainer = document.querySelector('.screen-2');
      if (scrollContainer && screen === 2) {
        if (sidebarOpen) {
          // When sidebar opens, adjust scroll to prevent text hiding behind navbar
          const currentScroll = scrollContainer.scrollTop;
          scrollContainer.scrollTop = Math.max(0, currentScroll - 50);
        }
        // When sidebar closes, maintain current scroll position (no action needed)
      }
    };

    // Add a small delay to ensure DOM has updated
    const timeoutId = setTimeout(handleSidebarChange, 100);

    return () => clearTimeout(timeoutId);
  }, [sidebarOpen, screen]);

  const handleNewChat = () => {
    // Save current chat if it has messages
    if (data.length > 0) {
      saveChatToHistory(data, currentChatId);
    }

    // Reset to new chat state
    setData([]);
    setPrompt("");
    setScreen(1); // Return to home screen
    setCurrentChatId(null);
  }

  // Chat management functions
  const deleteChat = (chatId) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);

    // Update localStorage
    try {
      localStorage.setItem('botgpt-chat-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to update chat history:', error);
    }

    // If deleted chat was the current one, return to home
    if (chatId === currentChatId) {
      setData([]);
      setCurrentChatId(null);
      setScreen(1);
    }
  }

  const renameChat = (chatId, newTitle) => {
    if (!newTitle.trim()) return;

    const updatedHistory = chatHistory.map(chat =>
      chat.id === chatId
        ? { ...chat, title: newTitle.trim() }
        : chat
    );

    setChatHistory(updatedHistory);

    // Update localStorage
    try {
      localStorage.setItem('botgpt-chat-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to update chat history:', error);
    }
  }

  const deleteCurrentChat = () => {
    if (currentChatId) {
      setConfirmDialog({
        isOpen: true,
        title: 'Hapus Chat',
        message: 'Apakah Anda yakin ingin menghapus percakapan ini? Tindakan ini tidak dapat dibatalkan.',
        onConfirm: () => {
          deleteChat(currentChatId);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      });
    }
  }



  // Edit message functions
  const handleEditMessage = (messageIndex) => {
    setEditingMessageIndex(messageIndex);
  }

  const handleSaveEdit = async (newContent) => {
    if (!newContent.trim() || editingMessageIndex === null) return;

    // Update the message at the editing index
    const updatedData = [...data];
    updatedData[editingMessageIndex] = {
      ...updatedData[editingMessageIndex],
      content: newContent.trim()
    };

    // Remove all messages after the edited one (including AI responses)
    const messagesUpToEdit = updatedData.slice(0, editingMessageIndex + 1);
    setData(messagesUpToEdit);

    // Reset edit mode
    setEditingMessageIndex(null);

    // Regenerate AI response with edit flag
    await getResponse(newContent.trim(), true);
  }

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
  }

  return (
    <div className="flex h-screen text-white" style={{ backgroundColor: 'rgb(33, 33, 33)' }}>
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          onNewChat={handleNewChat}
          chatHistory={chatHistory}
          onSelectChat={loadChatFromHistory}
          currentChatId={currentChatId}
          onDeleteChat={(chatId) => {
            setConfirmDialog({
              isOpen: true,
              title: 'Hapus Chat',
              message: 'Apakah Anda yakin ingin menghapus percakapan ini? Tindakan ini tidak dapat dibatalkan.',
              onConfirm: () => {
                deleteChat(chatId);
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
              }
            });
          }}
          onRenameChat={renameChat}
          onOpenSearch={() => setShowSearchModal(true)}
        />
      </div>

      {/* Area Konten Utama */}
      <div className={`konten-utama flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[260px]' : 'ml-[51px]'}`}>
        {/* Navbar Tetap - Hanya tampil dalam mode percakapan */}
        {screen === 2 && (
          <div className={`navbar-tetap fixed top-0 z-20 transition-all duration-300 ease-in-out ${sidebarOpen ? 'left-[260px]' : 'left-[51px]'} right-0`} style={{ backgroundColor: 'rgb(33, 33, 33)' }}>
            <Navbar onDeleteCurrentChat={deleteCurrentChat} />
          </div>
        )}

        {/* Konten yang Dapat Digulir */}
        <div className={`flex-1 ${screen === 2 ? 'mt-[52px]' : ''} flex flex-col`} style={{ backgroundColor: 'rgb(33, 33, 33)' }}>
          <div className="screens flex-1" style={{ backgroundColor: 'rgb(33, 33, 33)' }}>
            {
              screen === 1 ?
                <div className="screen-1 flex-1 flex items-center justify-center flex-col min-h-screen relative">
                  <div className="flex flex-col items-center mb-16">
                    <h3 className='!text-[40px] font-[700] text-white mb-8'>Bot<span className='text-purple-500'>GPT</span></h3>
                    <div className="flex mt-5 items-center gap-[15px] flex-wrap justify-center">
                      <div onClick={() => handleExampleClick("Buatkan website menggunakan html css dan js.")} className="card w-[200px] h-[fit] cursor-pointer bg-zinc-800 transition-all hover:bg-zinc-700 rounded-lg p-[15px] text-white">
                        <i className='text-[30px] text-purple-400'><RiComputerFill /></i>
                        <p className='mt-3 text-sm'>Buatkan website menggunakan html css dan js.</p>
                      </div>
                      <div onClick={() => handleExampleClick("Tuliskan buku untuk saya. topiknya tentang coding.")} className="card w-[200px] h-[fit] cursor-pointer bg-zinc-800 transition-all hover:bg-zinc-700 rounded-lg p-[15px] text-white">
                        <i className='text-[30px] text-purple-400'><GiWhiteBook /></i>
                        <p className='mt-3 text-sm'>Tuliskan buku untuk saya. topiknya tentang coding.</p>
                      </div>
                      <div onClick={() => handleExampleClick("Ceritakan sebuah cerita lucu.")} className="card w-[200px] h-[fit] cursor-pointer bg-zinc-800 transition-all hover:bg-zinc-700 rounded-lg p-[15px] text-white">
                        <i className='text-[30px] text-purple-400'><GiOpenBook /></i>
                        <p className='mt-3 text-sm'>Ceritakan sebuah cerita lucu.</p>
                      </div>
                      <div onClick={() => handleExampleClick("Buatkan blog untuk saya dengan topik web development.")} className="card w-[200px] h-[fit] cursor-pointer bg-zinc-800 transition-all hover:bg-zinc-700 rounded-lg p-[15px] text-white">
                        <i className='text-[30px] text-purple-400'><FaBloggerB /></i>
                        <p className='mt-3 text-sm'>Buatkan blog untuk saya dengan topik web development.</p>
                      </div>
                    </div>
                  </div>


                </div> : <>
                  <div ref={chatContainerRef} className="screen-2 overflow-y-auto flex-1 pt-6 pb-32 px-[40px]">
                    {
                      data && data.length > 0 ? data.map((item, index) => {
                        return (
                          <div key={index} className="group relative">
                            {
                              item.role === "user" ?
                                <div className="user-message-wrapper">
                                  <div className="user-message-container">
                                    <div className={`user-message-box ${editingMessageIndex === index ? 'editing' : ''}`}>

                                      {editingMessageIndex === index ? (
                                        <EditableMessage
                                          content={item.content}
                                          onSave={handleSaveEdit}
                                          onCancel={handleCancelEdit}
                                        />
                                      ) : (
                                        <>
                                          <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                                          <MessageActions
                                            type="user"
                                            content={item.content}
                                            position="bottom-right"
                                            onEdit={() => handleEditMessage(index)}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div> :
                                <div className="ai-message-container">
                                  <div className="ai-message-content">
                                    <Markdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                    >
                                      {item.content}
                                    </Markdown>
                                    <MessageActions
                                      type="ai"
                                      content={item.content}
                                      position="bottom-left"
                                    />
                                  </div>
                                </div>
                            }
                          </div>
                        )
                      }) : <div className="text-white text-center mt-20">Belum ada pesan!</div>
                    }
                    {
                      loading ?
                        <div className="loader flex justify-center"><BeatLoader color='#fff' /></div> : ""
                    }
                  </div>
                </>
            }
          </div>

          {/* Kotak Input Tetap */}
          <div className={`kotak-input-tetap fixed bottom-0 z-25 transition-all duration-300 ease-in-out ${sidebarOpen ? 'left-[260px]' : 'left-[51px]'} right-0`}>
            <div className="input-wrapper">
              <div className="input-container-conversation">
                <textarea
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      getResponse();
                    } else if (e.key === "Enter" && e.shiftKey) {
                      // Izinkan perilaku default untuk baris baru
                    }
                  }}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  value={prompt}
                  placeholder="Masukkan pertanyaan Anda!"
                  className="input-textarea-conversation"
                  rows={1}
                />
              </div>
              <p className='text-white text-center text-xs opacity-70' style={{ margin: '8px 0' }}>BotGPT dapat membuat kesalahan! Periksa kembali jawabannya.</p>
            </div>
          </div>
        </div>
      </div>



      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        chatHistory={chatHistory}
        onSelectChat={loadChatFromHistory}
      />
    </div>
  )
}

export default App