import React, { useState, useEffect, useRef } from 'react'
import { HiOutlineMagnifyingGlass, HiXMark } from 'react-icons/hi2'

const SearchModal = ({ isOpen, onClose, chatHistory = [], onSelectChat }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false)
  const inputRef = useRef(null)

  const filteredHistory = chatHistory.filter(chat => {
    const searchTermLower = searchTerm.toLowerCase()

    // Search in chat title
    if (chat.title.toLowerCase().includes(searchTermLower)) {
      return true
    }

    // Search in all messages content
    if (chat.messages && Array.isArray(chat.messages)) {
      return chat.messages.some(message =>
        message.content && message.content.toLowerCase().includes(searchTermLower)
      )
    }

    return false
  })

  // Function to find matching content in messages
  const findMatchingContent = (chat, searchTerm) => {
    if (!searchTerm || !chat.messages) return null

    const searchTermLower = searchTerm.toLowerCase()

    // Check if title matches
    if (chat.title.toLowerCase().includes(searchTermLower)) {
      return { type: 'title', content: chat.title }
    }

    // Find matching message
    for (const message of chat.messages) {
      if (message.content && message.content.toLowerCase().includes(searchTermLower)) {
        // Get excerpt around the match
        const contentLower = message.content.toLowerCase()
        const matchIndex = contentLower.indexOf(searchTermLower)
        const start = Math.max(0, matchIndex - 30)
        const end = Math.min(message.content.length, matchIndex + searchTerm.length + 30)

        let excerpt = message.content.substring(start, end)
        if (start > 0) excerpt = '...' + excerpt
        if (end < message.content.length) excerpt = excerpt + '...'

        return {
          type: message.role === 'user' ? 'user' : 'ai',
          content: excerpt,
          fullContent: message.content
        }
      }
    }

    return null
  }

  // Utility function to escape regex special characters
  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // Function to highlight matching text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text

    const escapedSearchTerm = escapeRegex(searchTerm)
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400 text-black px-0.5 rounded">
          {part}
        </span>
      ) : part
    )
  }

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setSelectedIndex(0)
      setIsKeyboardNavigation(false)

      // Lock body scroll when modal opens
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight
      const originalPosition = document.body.style.position

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.position = 'fixed'
      document.body.style.top = `-${window.scrollY}px`
      document.body.style.width = '100%'

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)

      // Cleanup function to restore scroll when modal closes
      return () => {
        const scrollY = document.body.style.top
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
        document.body.style.position = originalPosition
        document.body.style.top = ''
        document.body.style.width = ''

        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1)
        }
      }
    } else {
      // Reset states when modal closes
      setSelectedIndex(0)
      setSearchTerm('')
      setIsKeyboardNavigation(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setIsKeyboardNavigation(true)
          setSelectedIndex(prev =>
            prev < filteredHistory.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setIsKeyboardNavigation(true)
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredHistory[selectedIndex]) {
            onSelectChat(filteredHistory[selectedIndex].id)
            onClose()
            // Reset state after selection
            setIsKeyboardNavigation(false)
            setSelectedIndex(0)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredHistory, selectedIndex, onSelectChat, onClose])

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const preventScroll = (e) => {
      // Allow scroll only within the modal results area
      const modalElement = e.target.closest('.search-modal-content')
      if (!modalElement) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const preventTouchMove = (e) => {
      const modalElement = e.target.closest('.search-modal-content')
      if (!modalElement) {
        e.preventDefault()
        return false
      }
    }

    // Prevent wheel scroll on background
    document.addEventListener('wheel', preventScroll, { passive: false })
    // Prevent touch scroll on mobile
    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      document.removeEventListener('wheel', preventScroll)
      document.removeEventListener('touchmove', preventTouchMove)
    }
  }, [isOpen])

  useEffect(() => {
    // Reset selected index when search results change and ensure it's within bounds
    setSelectedIndex(prev => {
      if (filteredHistory.length === 0) return 0
      const newIndex = Math.min(prev, filteredHistory.length - 1)
      // Reset keyboard navigation when results change significantly
      if (newIndex !== prev) {
        setIsKeyboardNavigation(false)
      }
      return newIndex
    })
  }, [filteredHistory.length, searchTerm])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[15vh] z-50"
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onClick={(e) => {
        // Close modal when clicking on backdrop (outside the modal content)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-zinc-800 rounded-xl shadow-2xl border border-zinc-600 w-full max-w-lg mx-4 overflow-hidden search-modal-content">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-zinc-700">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari di judul chat atau isi percakapan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsKeyboardNavigation(false) // Reset keyboard navigation when typing
            }}
            className="flex-1 bg-transparent text-white placeholder-zinc-400 focus:outline-none text-base"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-lg hover:bg-zinc-700 transition-colors flex-shrink-0"
          >
            <HiXMark className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Results */}
        <div
          className="max-h-96 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {searchTerm === '' ? (
            <div className="p-8 text-center">
              <HiOutlineMagnifyingGlass className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Mulai mengetik untuk mencari di judul chat atau isi percakapan</p>
              <p className="text-zinc-500 text-xs mt-2">Gunakan Ctrl+K untuk membuka/menutup pencarian • Klik di luar untuk menutup</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="py-2">
              {filteredHistory.map((chat, index) => {
                const matchingContent = findMatchingContent(chat, searchTerm)

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id)
                      onClose()
                    }}
                    className={`flex items-start p-4 mx-2 rounded-lg cursor-pointer transition-all duration-150 ease-in-out ${index === selectedIndex
                        ? 'bg-purple-600 bg-opacity-20 border border-purple-500 shadow-lg transform scale-[1.02]'
                        : 'hover:bg-zinc-700 border border-transparent'
                      }`}
                    onMouseEnter={() => {
                      if (!isKeyboardNavigation) {
                        setSelectedIndex(index)
                      }
                    }}
                    onMouseMove={() => {
                      // Reset keyboard navigation flag when mouse is actively used
                      if (isKeyboardNavigation) {
                        setIsKeyboardNavigation(false)
                        setSelectedIndex(index)
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-purple-200' : 'text-white'
                        }`}>
                        {highlightText(chat.title, searchTerm)}
                      </div>
                      <div className={`text-xs mt-1 truncate ${index === selectedIndex ? 'text-purple-300' : 'text-zinc-400'
                        }`}>
                        {chat.createdAt}
                      </div>

                      {/* Show matching content preview if not from title */}
                      {matchingContent && matchingContent.type !== 'title' && (
                        <div className={`text-xs mt-2 p-2 rounded border-l-2 ${index === selectedIndex
                            ? 'bg-purple-900 bg-opacity-30 border-purple-400 text-purple-100'
                            : 'bg-zinc-800 border-zinc-600 text-zinc-300'
                          }`}>
                          <div className={`text-xs mb-1 ${matchingContent.type === 'user'
                              ? (index === selectedIndex ? 'text-purple-300' : 'text-blue-400')
                              : (index === selectedIndex ? 'text-purple-300' : 'text-green-400')
                            }`}>
                            {matchingContent.type === 'user' ? '👤 Anda:' : '🤖 AI:'}
                          </div>
                          <div className="leading-relaxed">
                            {highlightText(matchingContent.content, searchTerm)}
                          </div>
                        </div>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <div className="ml-2 text-purple-400 text-xs mt-1 flex-shrink-0">
                        ↵
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-zinc-400 text-sm mb-2">
                Tidak ada chat yang cocok
              </div>
              <div className="text-zinc-500 text-xs">
                untuk "{searchTerm}" di judul atau isi percakapan
              </div>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        {(searchTerm !== '' || filteredHistory.length > 0) && (
          <div className="border-t border-zinc-700 px-4 py-3 bg-zinc-850">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300 font-mono">↑↓</kbd>
                  navigasi
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300 font-mono">Enter</kbd>
                  pilih
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300 font-mono text-xs">Esc</kbd>
                  tutup
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300 font-mono text-xs">Ctrl+K</kbd>
                  tutup
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchModal
