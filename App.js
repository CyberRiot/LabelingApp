// client/src/App.js
import React from 'react';
import './App.css';
import VideoAnnotator from './components/VideoAnnotator'; // Adjust path if necessary
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <VideoAnnotator />
    </DndProvider>
  );
}

export default App;
