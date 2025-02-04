// src/components/LabelBox.jsx
import React, { useState, useEffect } from 'react';
import './LabelBox.css';

const LabelBox = ({ box, timelineWidth, duration, onUpdate }) => {
  // Calculate left and width percentages based on the video’s duration.
  const leftPercent = (box.start / duration) * 100;
  const widthPercent = ((box.end - box.start) / duration) * 100;

  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      // Convert pixel delta to seconds.
      const deltaTime = (deltaX / timelineWidth) * duration;
      let newEnd = box.end + deltaTime;
      if (newEnd > duration) newEnd = duration;
      if (newEnd < box.start + 0.1) newEnd = box.start + 0.1; // enforce minimum width
      onUpdate(box.id, { ...box, end: newEnd });
      setStartX(e.clientX);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, box, timelineWidth, duration, onUpdate]);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div 
      className="label-box" 
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: box.color,
      }}
    >
      {box.labelNumber}
      <div className="resize-handle" onMouseDown={handleMouseDown}></div>
    </div>
  );
};

export default LabelBox;
