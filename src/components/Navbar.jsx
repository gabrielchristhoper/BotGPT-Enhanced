import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FaRobot } from "react-icons/fa6";
import { HiOutlineEllipsisHorizontal } from 'react-icons/hi2';

const Navbar = ({ onDeleteCurrentChat, scrollContainerRef }) => {
  const [showBorder, setShowBorder] = useState(false);
  const throttleRef = useRef(null);

  const throttledHandleScroll = useCallback(() => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      if (scrollContainerRef?.current) {
        try {
          const scrollTop = scrollContainerRef.current.scrollTop;
          setShowBorder(scrollTop > 20); // Show border when scrolled more than 20px
        } catch (error) {
          console.warn('Error accessing scroll container:', error);
        }
      }
    }, 16); // ~60fps throttling
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef?.current;

    if (!container) {
      return;
    }

    container.addEventListener('scroll', throttledHandleScroll);

    return () => {
      if (container) {
        container.removeEventListener('scroll', throttledHandleScroll);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [throttledHandleScroll, scrollContainerRef]);

  return (
    <div
      className="relative h-[52px] flex items-center justify-between px-4 text-white transition-all duration-200"
      style={{
        backgroundColor: 'rgb(33, 33, 33)',
        borderBottom: showBorder ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}
    >
      <div className="logo flex items-center gap-[10px]">
        <i className='text-[20px] text-purple-400'><FaRobot /></i>
        <h3 className='text-[25px] font-[700] text-white'>Bot<span className='text-purple-500'>GPT</span></h3>
      </div>

      {/* Three-dot menu for deleting chat */}
      <button
        onClick={onDeleteCurrentChat}
        className="flex items-center justify-center w-[20px] h-[20px] hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        style={{ position: 'absolute', top: '16px', right: '16px' }}
        aria-label="Delete current chat"
      >
        <HiOutlineEllipsisHorizontal className="w-5 h-5" />
      </button>
    </div>
  )
}

export default Navbar