// src/components/LabelsPanel.jsx
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import './LabelsPanel.css';

const DraggableLabel = ({ label }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'LABEL',
    item: {
      labelNumber: label.number,
      labelName: label.name,
      color: label.color,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <tr ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}>
      <td>{label.number}</td>
      <td>{label.name}</td>
      <td>
        <div className="color-box" style={{ backgroundColor: label.color }}></div>
      </td>
    </tr>
  );
};

const LabelsPanel = ({ labels, onAddLabel }) => {
  const [newLabel, setNewLabel] = useState('');
  const handleAdd = () => {
    if (newLabel.trim() !== '') {
      onAddLabel(newLabel);
      setNewLabel('');
    }
  };
  return (
    <div className="labels-panel">
      <h3>Labels</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Color</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <DraggableLabel key={label.number} label={label} />
          ))}
        </tbody>
      </table>
      <div className="add-label">
        <input
          type="text"
          placeholder="Enter label name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button onClick={handleAdd}>Add Label</button>
      </div>
    </div>
  );
};

export default LabelsPanel;
