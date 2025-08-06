import React, { useState } from 'react'
import { createPortal } from 'react-dom'

const Tooltip = ({ text, children, showOnlyWhenClosed = false, sidebarOpen = true, position = 'right' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Hanya tampil saat sidebar tertutup jika showOnlyWhenClosed = true
  const shouldShowTooltip = showOnlyWhenClosed ? !sidebarOpen : true

  const handleMouseEnter = (e) => {
    if (!shouldShowTooltip) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    
    if (position === 'bottom') {
      // Posisi tooltip di bawah element
      setTooltipPosition({
        x: rect.left + rect.width / 2, // tengah horizontal element
        y: rect.bottom + 8 // 8px di bawah element
      })
    } else {
      // Posisi default (kanan sidebar)
      const sidebarWidth = sidebarOpen ? 245 : 51
      setTooltipPosition({
        x: sidebarWidth + 12, // 12px dari kanan sidebar (fixed position)
        y: rect.top + rect.height / 2 // tengah vertikal tombol
      })
    }
    
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  // Render tooltip menggunakan portal agar benar-benar di luar sidebar
  const tooltipElement = isVisible && shouldShowTooltip ? (
    <div 
      className="fixed pointer-events-none"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        transform: position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
        zIndex: 50000 // Z-index sangat tinggi agar di atas semua elemen
      }}
    >
      <div 
        className="text-white text-sm px-3 py-2 rounded-md whitespace-nowrap relative shadow-lg"
        style={{
          fontSize: '13px',
          fontWeight: '500',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {text}
        {/* Arrow */}
        {position === 'bottom' ? (
          // Arrow pointing up untuk tooltip di bawah
          <div 
            className="absolute left-1/2 bottom-full transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        ) : (
          // Arrow pointing left untuk tooltip di kanan
          <div 
            className="absolute right-full top-1/2 transform -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: '4px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <div 
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'static' }} // Pastikan tidak ada positioning yang mengganggu
      >
        {children}
      </div>
      
      {/* Render tooltip di luar DOM tree menggunakan portal */}
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  )
}

export default Tooltip