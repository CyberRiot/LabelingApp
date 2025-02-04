// src/components/VideoAnnotator.jsx
import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import Timeline from './Timeline';
import LabelsPanel from './LabelsPanel';
import './VideoAnnotator.css';

const VideoAnnotator = () => {
  // Each video object: { id, file, url, duration, labelBoxes, history }
  const [videos, setVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [labels, setLabels] = useState([]); // Global labels: { number, name, color }
  const playerRefs = useRef({}); // Map of video id -> ReactPlayer ref

  // Handle file uploads (multiple allowed)
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => {
      const url = URL.createObjectURL(file);
      return {
        id: Date.now() + Math.random(),
        file,
        url,
        duration: 0,
        labelBoxes: [],
        history: []
      };
    });
    setVideos(prev => [...prev, ...newVideos]);
    if (!activeVideoId && newVideos.length > 0) {
      setActiveVideoId(newVideos[0].id);
    }
  };

  // When a video is ready, update its duration.
  const updateDuration = (videoId, duration) => {
    setVideos(prev =>
      prev.map(video =>
        video.id === videoId ? { ...video, duration } : video
      )
    );
  };

  // Seek a given video to a time.
  const handleSeek = (videoId, time) => {
    if (playerRefs.current[videoId]) {
      playerRefs.current[videoId].seekTo(time, 'seconds');
    }
  };

  // Update labelBoxes for the active video (pushing previous state for undo).
  const updateLabelBoxes = (videoId, newLabelBoxes) => {
    setVideos(prev =>
      prev.map(video =>
        video.id === videoId ? { ...video, history: [...video.history, video.labelBoxes], labelBoxes: newLabelBoxes } : video
      )
    );
  };

  // Global Undo for the active video.
  const undoLastChange = () => {
    setVideos(prev =>
      prev.map(video => {
        if (video.id === activeVideoId && video.history.length > 0) {
          const newHistory = [...video.history];
          const lastState = newHistory.pop();
          return { ...video, labelBoxes: lastState, history: newHistory };
        }
        return video;
      })
    );
  };

  // onDropNewLabel and onUpdateLabelBox for the active video.
  const onDropNewLabel = (newBox) => {
    setVideos(prev =>
      prev.map(video => {
        if (video.id === activeVideoId) {
          const newBoxWithId = { ...newBox, id: video.labelBoxes.length };
          return { ...video, labelBoxes: [...video.labelBoxes, newBoxWithId] };
        }
        return video;
      })
    );
  };

  const onUpdateLabelBox = (updatedBox) => {
    setVideos(prev =>
      prev.map(video => {
        if (video.id === activeVideoId) {
          const newLabelBoxes = video.labelBoxes.map(box =>
            box.id === updatedBox.id ? updatedBox : box
          );
          return { ...video, labelBoxes: newLabelBoxes };
        }
        return video;
      })
    );
  };

  // Add a new global label (with a randomly assigned color that remains consistent).
  const addLabel = (labelName) => {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    const newLabel = { number: labels.length, name: labelName, color };
    setLabels([...labels, newLabel]);
  };

  // Video navigation: switch the active video.
  const goToPreviousVideo = () => {
    const index = videos.findIndex(v => v.id === activeVideoId);
    if (index > 0) {
      setActiveVideoId(videos[index - 1].id);
    }
  };

  const goToNextVideo = () => {
    const index = videos.findIndex(v => v.id === activeVideoId);
    if (index < videos.length - 1) {
      setActiveVideoId(videos[index + 1].id);
    }
  };

  return (
    <div className="video-annotator-container">
      <div className="top-bar">
        <div className="file-upload">
          <label>Load Video(s): </label>
          <input type="file" accept="video/*" multiple onChange={handleVideoUpload} />
        </div>
        <button className="undo-button" onClick={undoLastChange}>Undo</button>
      </div>
      <div className="main-content">
        <div className="video-area">
          {videos.length === 0 && (
            <div className="no-video">No video loaded.</div>
          )}
          {videos.length > 1 && (
            <div className="video-navigation">
              <button onClick={goToPreviousVideo} disabled={videos.findIndex(v => v.id === activeVideoId) === 0}>
                ◀ Previous
              </button>
              <button onClick={goToNextVideo} disabled={videos.findIndex(v => v.id === activeVideoId) === videos.length - 1}>
                Next ▶
              </button>
            </div>
          )}
          {videos.map(video => (
            video.id === activeVideoId && (
              <div key={video.id} className="video-container active">
                <ReactPlayer
                  ref={ref => { playerRefs.current[video.id] = ref; }}
                  url={video.url}
                  controls
                  width="100%"
                  height="70%"  /* Allocate space for timeline below */
                  onReady={() => updateDuration(video.id, playerRefs.current[video.id].getDuration())}
                />
                <Timeline
                  videoUrl={video.url}
                  duration={video.duration}
                  onSeek={(time) => handleSeek(video.id, time)}
                  labelBoxes={video.labelBoxes}
                  onDropNewLabel={onDropNewLabel}
                  onUpdateLabelBox={onUpdateLabelBox}
                />
              </div>
            )
          ))}
        </div>
        <div className="labels-area">
          <LabelsPanel labels={labels} onAddLabel={addLabel} />
        </div>
      </div>
    </div>
  );
};

export default VideoAnnotator;
