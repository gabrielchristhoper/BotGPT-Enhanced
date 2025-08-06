import React, { useState, useEffect, useRef } from 'react'
import {
  HiOutlineBars3,
  HiOutlinePencilSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineEllipsisVertical,
  HiOutlinePencil,
  HiOutlineTrash
} from 'react-icons/hi2'
import { FaRegCircleUser } from "react-icons/fa6";
import DropdownMenu from './DropdownMenu'
import Tooltip from './Tooltip'

const Sidebar = ({
  isOpen,
  onToggle,
  onNewChat,
  chatHistory = [],
  onSelectChat,
  currentChatId,
  onDeleteChat,
  onRenameChat,
  onOpenSearch
}) => {
  const [hoveredChatId, setHoveredChatId] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  // Refs untuk custom scrollbar
  const chatHistoryRef = useRef(null)
  const scrollbarThumbRef = useRef(null)
  const scrollbarTrackRef = useRef(null)

  const handleChatMenu = (event, chatId) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({
      x: rect.left - 150,
      y: rect.bottom + 5
    })
    setActiveMenuId(chatId)
  }

  const handleRename = (chatId, currentTitle) => {
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
    setActiveMenuId(null)
  }

  const handleSaveRename = (chatId) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim())
    }
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleCancelRename = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleDeleteChat = (chatId) => {
    onDeleteChat(chatId)
    setActiveMenuId(null)
  }

  // Scrollbar constants
  const SCROLLBAR_TOP_PADDING = 20; // Jarak dari atas (segitiga + gap)
  const SCROLLBAR_BOTTOM_PADDING = 20; // Jarak dari bawah (segitiga + gap)
  const MIN_THUMB_HEIGHT = 20; // Tinggi minimum thumb
  const THUMB_CENTER_OFFSET_DIVISOR = 2; // For centering thumb on click position

  // Cache for track rect to improve performance
  const trackRectCache = useRef(null);
  const trackHeightCache = useRef(null);

  // Custom scrollbar functions
  const updateScrollbar = () => {
    if (!chatHistoryRef.current || !scrollbarThumbRef.current || !scrollbarTrackRef.current || !isOpen) return

    const chatHistory = chatHistoryRef.current
    const scrollbarThumb = scrollbarThumbRef.current
    const scrollbarTrack = scrollbarTrackRef.current

    const scrollHeight = chatHistory.scrollHeight
    const clientHeight = chatHistory.clientHeight
    const scrollTop = chatHistory.scrollTop

    if (scrollHeight <= clientHeight) {
      scrollbarThumb.style.display = 'none'
      return
    }

    scrollbarThumb.style.display = 'block'

    // Cache track rect calculation for performance
    if (!trackRectCache.current || !trackHeightCache.current) {
      trackRectCache.current = scrollbarTrack.getBoundingClientRect()
      trackHeightCache.current = trackRectCache.current.height - SCROLLBAR_TOP_PADDING - SCROLLBAR_BOTTOM_PADDING
    }

    const trackHeight = trackHeightCache.current
    const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT)

    // Check for division by zero before calculating scroll ratio
    const scrollableHeight = scrollHeight - clientHeight
    const scrollRatio = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0
    const availableThumbArea = trackHeight - thumbHeight
    const thumbTop = SCROLLBAR_TOP_PADDING + (scrollRatio * availableThumbArea)

    scrollbarThumb.style.height = `${thumbHeight}px`
    scrollbarThumb.style.top = `${thumbTop}px`
  }

  const handleScrollbarClick = (e) => {
    if (!chatHistoryRef.current || !scrollbarThumbRef.current || !scrollbarTrackRef.current || !isOpen) return

    const chatHistory = chatHistoryRef.current
    const scrollbarThumb = scrollbarThumbRef.current
    const scrollbarTrack = scrollbarTrackRef.current

    if (e.target === scrollbarThumb) return // Don't handle clicks on the thumb itself

    // Get click position and track dimensions
    const trackRect = scrollbarTrack.getBoundingClientRect()
    const clickY = e.clientY
    const thumbHeight = scrollbarThumb.offsetHeight

    // Calculate usable track area (excluding padding)
    const usableTrackHeight = trackRect.height - SCROLLBAR_TOP_PADDING - SCROLLBAR_BOTTOM_PADDING

    // Calculate click position relative to the usable track area
    const clickPositionInTrack = clickY - trackRect.top - SCROLLBAR_TOP_PADDING

    // Calculate desired thumb position (centered on click)
    const thumbCenterOffset = thumbHeight / THUMB_CENTER_OFFSET_DIVISOR
    const desiredThumbPosition = clickPositionInTrack - thumbCenterOffset

    // Constrain thumb position within valid bounds
    const minThumbPosition = 0
    const maxThumbPosition = usableTrackHeight - thumbHeight
    const constrainedThumbPosition = Math.max(minThumbPosition, Math.min(desiredThumbPosition, maxThumbPosition))

    // Calculate scroll ratio and new scroll position
    const availableThumbMovementArea = usableTrackHeight - thumbHeight
    const scrollRatio = availableThumbMovementArea > 0 ? constrainedThumbPosition / availableThumbMovementArea : 0

    const chatScrollableHeight = chatHistory.scrollHeight - chatHistory.clientHeight
    const newScrollPosition = scrollRatio * chatScrollableHeight

    chatHistory.scrollTop = newScrollPosition
  }

  const handleThumbDrag = (e) => {
    e.preventDefault()
    if (!chatHistoryRef.current || !scrollbarTrackRef.current || !scrollbarThumbRef.current || !isOpen) return

    const chatHistory = chatHistoryRef.current
    const scrollbarThumb = scrollbarThumbRef.current
    const scrollbarTrack = scrollbarTrackRef.current

    const trackRect = scrollbarTrack.getBoundingClientRect();
    const thumbHeight = scrollbarThumb.offsetHeight;
    const trackHeight = trackRect.height - SCROLLBAR_TOP_PADDING - SCROLLBAR_BOTTOM_PADDING;
    const minThumbTop = SCROLLBAR_TOP_PADDING;
    const maxThumbTop = SCROLLBAR_TOP_PADDING + trackHeight - thumbHeight;

    const startY = e.clientY
    const startThumbTop = parseFloat(scrollbarThumb.style.top) || minThumbTop
    const maxScrollTop = chatHistory.scrollHeight - chatHistory.clientHeight

    // Pre-calculate values to avoid repeated calculations and prevent division by zero
    const scrollableArea = trackHeight - thumbHeight;
    const hasScrollableArea = scrollableArea > 0;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - startY
      const newThumbTop = Math.max(minThumbTop, Math.min(startThumbTop + deltaY, maxThumbTop))

      // Convert thumb position to scroll position with division by zero guard
      const relativeThumbTop = newThumbTop - minThumbTop;
      const scrollRatio = hasScrollableArea ? relativeThumbTop / scrollableArea : 0;
      const newScrollTop = scrollRatio * maxScrollTop;

      chatHistory.scrollTop = newScrollTop
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = '' // Restore text selection
    }

    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Clear cache when needed
  const clearTrackCache = () => {
    trackRectCache.current = null;
    trackHeightCache.current = null;
  };

  // Update scrollbar ketika content berubah
  useEffect(() => {
    if (isOpen) {
      clearTrackCache(); // Clear cache when sidebar opens/closes or content changes
      updateScrollbar(); // Call synchronously for immediate DOM updates
    }
  }, [isOpen, chatHistory])

  // Event listeners untuk scroll dan resize
  useEffect(() => {
    const chatHistory = chatHistoryRef.current;

    const handleResize = () => {
      clearTrackCache(); // Clear cache on resize
      updateScrollbar();
    };

    if (chatHistory) {
      chatHistory.addEventListener('scroll', updateScrollbar);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (chatHistory) {
        chatHistory.removeEventListener('scroll', updateScrollbar);
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isOpen]);

  return (
    <div className={`sidebar ${!isOpen ? 'tertutup' : ''} bg-neutral-900 h-screen flex border-r border-zinc-700 overflow-hidden ${isOpen ? 'w-[260px]' : 'w-[51px]'}`}>
      {/* Main sidebar content */}
      <div className="sidebar-main flex flex-col flex-1" style={{ width: isOpen ? '245px' : '51px' }}>
        {/* Header dengan tombol toggle */}
        <div className="flex-shrink-0">
          <button
            onClick={onToggle}
            className="tombol-sidebar"
          >
            <HiOutlineBars3 className="w-[21px] h-[21px]" />
          </button>
        </div>

        {/* Tombol navigasi - tidak ikut scroll */}
        <div className="sidebar-fixed-content flex-shrink-0">
          {/* Tombol Obrolan Baru */}
          <Tooltip text="Obrolan Baru" showOnlyWhenClosed={true} sidebarOpen={isOpen}>
            <button onClick={onNewChat} className="tombol-sidebar">
              <HiOutlinePencilSquare className="w-[21px] h-[21px]" />
              <span className="teks-sidebar">Obrolan Baru</span>
            </button>
          </Tooltip>

          {/* Tombol Pencarian */}
          <Tooltip text={`Cari Obrolan ${isOpen ? '(Ctrl+K)' : ''}`} showOnlyWhenClosed={true} sidebarOpen={isOpen}>
            <button onClick={onOpenSearch} className="tombol-sidebar tombol-pencarian">
              <HiOutlineMagnifyingGlass className="w-[21px] h-[21px]" />
              <span className="teks-sidebar">Cari Obrolan</span>
              {isOpen && (
                <span className="text-xs text-zinc-500 ctrl-k-text">
                  Ctrl+K
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        {/* Area yang bisa di-scroll - termasuk header "Obrolan Terbaru" */}
        <div className="chat-history-container flex-grow min-w-0 overflow-hidden">
          <div className="chat-history-content" ref={chatHistoryRef}>
            <div className="px-4 pt-4 min-w-0 w-full">
              {isOpen && (
                <div className="flex items-center text-zinc-400 pb-2 min-w-0 w-full">
                  <HiOutlineClock className="w-[21px] h-[21px] flex-shrink-0 min-w-[21px]" />
                  <span className="ml-2.5 text-sm font-medium text-zinc-400 whitespace-nowrap flex-shrink-0 teks-sidebar">
                    Obrolan Terbaru
                  </span>
                </div>
              )}
              <div className="chat-history-list min-w-0 w-full">
                {chatHistory.length > 0 ? (
                  <div className="space-y-1">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`relative group rounded-lg transition-colors hover:bg-zinc-800 ${currentChatId === chat.id ? 'bg-zinc-800' : ''}`}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                      >
                        {editingChatId === chat.id ? (
                          <div className="p-3">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename(chat.id)
                                } else if (e.key === 'Escape') {
                                  handleCancelRename()
                                }
                              }}
                              onBlur={() => handleSaveRename(chat.id)}
                              className="w-full bg-zinc-700 text-white text-sm px-2 py-1 rounded border border-zinc-600 focus:border-purple-500 focus:outline-none"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => onSelectChat(chat.id)}
                            className="flex items-center justify-between p-3 cursor-pointer min-w-0 w-full"
                          >
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="text-white text-sm font-medium truncate teks-sidebar">
                                {chat.title}
                              </div>
                              <div className="text-zinc-400 text-xs mt-1 truncate teks-sidebar">
                                {chat.createdAt}
                              </div>
                            </div>
                            {(hoveredChatId === chat.id || activeMenuId === chat.id) && (
                              <button
                                onClick={(e) => handleChatMenu(e, chat.id)}
                                className="ml-2 p-1 rounded hover:bg-zinc-700 transition-colors"
                              >
                                <HiOutlineEllipsisVertical className="w-4 h-4 text-zinc-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-zinc-500 text-sm teks-sidebar">
                    Belum ada riwayat
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bagian Profil Pengguna */}
        <div className="flex-shrink-0 mt-auto">
          <button className="tombol-sidebar">
            <FaRegCircleUser className="w-[21px] h-[21px]" />
            <span className="teks-sidebar font-medium">Profil</span>
          </button>
        </div>

        {/* Chat History Dropdown Menu */}
        <DropdownMenu
          isOpen={activeMenuId !== null}
          onClose={() => setActiveMenuId(null)}
          position={menuPosition}
          items={[
            {
              label: 'Ubah Nama',
              icon: HiOutlinePencil,
              onClick: () => {
                const chat = chatHistory.find(c => c.id === activeMenuId)
                if (chat) handleRename(activeMenuId, chat.title)
              }
            },
            {
              label: 'Hapus',
              icon: HiOutlineTrash,
              onClick: () => handleDeleteChat(activeMenuId),
              danger: true
            }
          ]}
        />
      </div>

      {/* Integrated Custom Scrollbar - INSIDE sidebar */}
      <div className={`sidebar-scrollbar-area ${!isOpen ? 'tertutup' : ''}`}>
        <div
          className="custom-scrollbar-track"
          ref={scrollbarTrackRef}
          onClick={handleScrollbarClick}
        >
          <div
            className="custom-scrollbar-thumb"
            ref={scrollbarThumbRef}
            onMouseDown={handleThumbDrag}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar