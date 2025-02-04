// src/components/Timeline.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import './Timeline.css';

const Timeline = ({
  videoUrl,
  duration,
  onSeek,
  labelBoxes,
  onDropNewLabel,
  onUpdateLabelBox,
}) => {
  const [thumbnails, setThumbnails] = useState([]);
  const timelineRef = useRef(null);       // Ref for the thumbnails container.
  const scrollContainerRef = useRef(null);  // Ref for the scrollable timeline.
  const THUMB_WIDTH = 200;  // New fixed thumbnail width.
  const THUMB_HEIGHT = 120; // New fixed thumbnail height.
  const interval = 1;       // One thumbnail per second.
  const maxThumbs = 10;     // TEST: Limit thumbnails to 10 seconds.

  useEffect(() => {
    if (!videoUrl || !duration) return;
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    const thumbs = [];
    let currentTime = 0;
    // Only generate thumbnails for up to maxThumbs seconds.
    const effectiveDuration = Math.min(duration, maxThumbs * interval);
    
    video.addEventListener('loadeddata', () => {
      const captureFrame = (time) => {
        return new Promise((resolve) => {
          video.currentTime = time;
          const onSeeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = THUMB_WIDTH;
            canvas.height = THUMB_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg');
            resolve({ time, src: dataURL });
            video.removeEventListener('seeked', onSeeked);
          };
          video.addEventListener('seeked', onSeeked);
        });
      };

      const generateThumbs = async () => {
        while (currentTime < effectiveDuration) {
          try {
            const thumb = await captureFrame(currentTime);
            thumbs.push(thumb);
          } catch (error) {
            console.error("Error capturing frame at", currentTime, error);
          }
          currentTime += interval;
        }
        setThumbnails(thumbs);
      };

      generateThumbs();
    });
  }, [videoUrl, duration]);

  // Auto-scroll: Adjust the scroll container so that the new label box edge is visible.
  const autoScrollForBox = (box, direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const boxLeft = box.startIndex * THUMB_WIDTH;
    const boxRight = box.endIndex * THUMB_WIDTH;
    if (direction === 'right' && boxRight > scrollLeft + containerWidth) {
      container.scrollLeft = boxRight - containerWidth;
    } else if (direction === 'left' && boxLeft < scrollLeft) {
      container.scrollLeft = boxLeft;
    }
  };

  // Extend the label box to the left by one thumbnail.
  const extendLabelLeft = (id) => {
    const box = labelBoxes.find(b => b.id === id);
    if (box && box.startIndex > 0) {
      const overlapping = labelBoxes.some(
        b => b.id !== id && (box.startIndex - 1) >= b.startIndex && (box.startIndex - 1) < b.endIndex
      );
      if (!overlapping) {
        const updatedBox = { ...box, startIndex: box.startIndex - 1 };
        onUpdateLabelBox(updatedBox);
        autoScrollForBox(updatedBox, 'left');
        onSeek(updatedBox.startIndex * interval);
      }
    }
  };

  // Extend the label box to the right by one thumbnail.
  const extendLabelRight = (id) => {
    const totalThumbs = thumbnails.length;
    const box = labelBoxes.find(b => b.id === id);
    if (box && box.endIndex < totalThumbs) {
      const overlapping = labelBoxes.some(
        b => b.id !== id && box.endIndex >= b.startIndex && box.endIndex < b.endIndex
      );
      if (!overlapping) {
        const updatedBox = { ...box, endIndex: box.endIndex + 1 };
        onUpdateLabelBox(updatedBox);
        autoScrollForBox(updatedBox, 'right');
        onSeek(updatedBox.endIndex * interval);
      }
    }
  };

  // Set up drop target using react-dnd.
  const [{ isOver }, drop] = useDrop({
    accept: 'LABEL',
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const x = clientOffset.x - timelineRect.left;
      const totalThumbs = thumbnails.length;
      const dropIndex = Math.floor(x / THUMB_WIDTH);
      // Prevent dropping if this thumbnail is already labeled.
      const overlapping = labelBoxes.some(box => dropIndex >= box.startIndex && dropIndex < box.endIndex);
      if (overlapping) return;
      const newBox = {
        labelNumber: item.labelNumber,
        startIndex: dropIndex,
        endIndex: dropIndex + 1, // Initially covers one full thumbnail.
        color: item.color,       // Use the consistent label color.
      };
      onDropNewLabel(newBox);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      className="timeline"
      ref={node => {
        scrollContainerRef.current = node;
        drop(node);
      }}
    >
      <div
        className="thumbnails-container"
        ref={timelineRef}
        style={{ width: thumbnails.length * THUMB_WIDTH + 'px' }}
      >
        {thumbnails.map((thumb, index) => (
          <div key={index} className="thumbnail-wrapper">
            <img
              src={thumb.src}
              alt={`Frame at ${thumb.time.toFixed(2)}s`}
              onClick={() => onSeek(thumb.time)}
              className="thumbnail"
            />
          </div>
        ))}
      </div>
      <div className="label-overlay">
        {labelBoxes.map((box) => {
          const leftPx = box.startIndex * THUMB_WIDTH;
          const widthPx = (box.endIndex - box.startIndex) * THUMB_WIDTH;
          return (
            <div
              key={box.id}
              className="label-overlay-box"
              style={{
                left: leftPx + 'px',
                width: widthPx + 'px',
                backgroundColor: box.color,
              }}
            >
              <button
                className="arrow left"
                onClick={(e) => { e.stopPropagation(); extendLabelLeft(box.id); }}
              >
                ◀
              </button>
              <span className="label-number">{box.labelNumber}</span>
              <button
                className="arrow right"
                onClick={(e) => { e.stopPropagation(); extendLabelRight(box.id); }}
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
