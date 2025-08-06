import React, { useState, useEffect } from 'react'
import { HiOutlineClipboard, HiOutlinePencil, HiOutlineCheck } from 'react-icons/hi2'
import Tooltip from './Tooltip'

const MessageActions = ({ type, content, onEdit, position = 'bottom-right' }) => {
  const [copyStates, setCopyStates] = useState({})

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text)

      // Set copy success state
      setCopyStates(prev => ({
        ...prev,
        [messageId]: { isCopied: true, timeoutId: null }
      }))

      // Clear after 3 seconds
      const timeoutId = setTimeout(() => {
        setCopyStates(prev => {
          const newState = { ...prev }
          delete newState[messageId]
          return newState
        })
      }, 3000)

      setCopyStates(prev => ({
        ...prev,
        [messageId]: { isCopied: true, timeoutId }
      }))

    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        // Same success handling as above
        setCopyStates(prev => ({
          ...prev,
          [messageId]: { isCopied: true, timeoutId: null }
        }))

        const timeoutId = setTimeout(() => {
          setCopyStates(prev => {
            const newState = { ...prev }
            delete newState[messageId]
            return newState
          })
        }, 3000)

        setCopyStates(prev => ({
          ...prev,
          [messageId]: { isCopied: true, timeoutId }
        }))

      } catch (fallbackError) {
        console.error('Copy failed:', fallbackError)
      }
    }
  }

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      Object.values(copyStates).forEach(state => {
        if (state.timeoutId) {
          clearTimeout(state.timeoutId)
        }
      })
    }
  }, [])

  const messageId = content.substring(0, 50) // Use content snippet as ID

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'absolute -bottom-9 left-0 z-10'
      case 'bottom-right':
        return 'absolute -bottom-9 right-0 z-10'
      default:
        return 'absolute -bottom-10 right-0 z-10'
    }
  }

  const buttons = []

  // Copy button (always available)
  const isCopied = copyStates[messageId]?.isCopied || false
  buttons.push({
    key: 'copy',
    icon: isCopied ? HiOutlineCheck : HiOutlineClipboard,
    tooltip: 'Copy',
    onClick: () => copyToClipboard(content, messageId)
  })

  // Edit button (only for user messages)
  if (type === 'user' && onEdit) {
    buttons.push({
      key: 'edit',
      icon: HiOutlinePencil,
      tooltip: 'Edit message',
      onClick: onEdit
    })
  }

  return (
    <div className={`${getPositionClasses()} flex space-x-1 transition-opacity duration-200 ${type === 'ai' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
      {buttons.map((button) => (
        <Tooltip key={button.key} text={button.tooltip} position="bottom">
          <button
            onClick={button.onClick}
            className="p-2 hover:bg-zinc-700 rounded transition-colors"
          >
            <button.icon className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
        </Tooltip>
      ))}
    </div>
  )
}

export default MessageActions