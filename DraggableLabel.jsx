// src/components/DraggableLabel.jsx
import React from 'react';
import { useDrag } from 'react-dnd';
import './DraggableLabel.css';

const DraggableLabel = ({ label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'LABEL',
    item: { label },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [label]);

  return (
    <div 
      ref={drag} 
      className="draggable-label" 
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {label.number} - {label.name}
    </div>
  );
};

export default DraggableLabel;
