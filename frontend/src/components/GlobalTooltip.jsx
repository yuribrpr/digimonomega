import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TooltipPortal = ({ children, coords, visible }) => {
  if (!visible) return null;
  return createPortal(
    <div 
      className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
      style={{ 
        left: coords.x, 
        top: coords.y,
        transform: 'translate(-50%, -100%) translateY(-8px)'
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export const GlobalTooltip = ({ children, content }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      <TooltipPortal coords={coords} visible={visible}>
        <div className="bg-slate-900 text-slate-50 text-xs px-3 py-2 rounded-md shadow-xl border border-slate-700 max-w-xs">
          {content}
        </div>
      </TooltipPortal>
    </>
  );
};

export default GlobalTooltip;
