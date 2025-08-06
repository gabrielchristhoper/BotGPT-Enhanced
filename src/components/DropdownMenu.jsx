import React, { useEffect, useRef } from 'react'

const DropdownMenu = ({ isOpen, onClose, position, items }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg py-1 min-w-[150px]"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex items-center ${
            item.danger ? 'text-red-400 hover:text-red-300' : 'text-white'
          }`}
        >
          {item.icon && <item.icon className="w-4 h-4 mr-3" />}
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default DropdownMenu