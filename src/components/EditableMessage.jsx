import React, { useState, useRef, useEffect } from 'react'

const EditableMessage = ({ content, onSave, onCancel }) => {
  const [editContent, setEditContent] = useState(content)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(content.length, content.length)
      // Auto-resize to fit content
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.max(scrollHeight, 80) + 'px'
    }
  }, [content])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleSave = () => {
    if (editContent.trim() && editContent.trim() !== content) {
      onSave(editContent.trim())
    } else {
      onCancel()
    }
  }

  const handleChange = (e) => {
    setEditContent(e.target.value)
    // Auto-resize with minimum height
    e.target.style.height = 'auto'
    const newHeight = Math.max(e.target.scrollHeight, 80)
    e.target.style.height = newHeight + 'px'
  }

  return (
    <div className="edit-message w-full">
      <textarea
        ref={textareaRef}
        value={editContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-800 text-white resize-none outline-none border border-zinc-500 rounded-lg p-3 text-[16px] leading-relaxed min-h-[80px] focus:border-zinc-400 transition-colors"
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit'
        }}
        placeholder="Edit your message..."
      />
      <div className="flex justify-end space-x-3 mt-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors rounded-lg hover:bg-zinc-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Save & Submit
        </button>
      </div>
    </div>
  )
}

export default EditableMessage