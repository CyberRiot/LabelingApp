# app.py
from flask import Flask, request, jsonify, send_file
import subprocess
import os
import json
import uuid

app = Flask(__name__)

@app.route('/api/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video provided'}), 400

    video_file = request.files['video']
    annotations = json.loads(request.form.get('annotations', '[]'))

    # Save the uploaded video
    uploads_dir = 'uploads'
    os.makedirs(uploads_dir, exist_ok=True)
    video_filename = f"{uuid.uuid4()}_{video_file.filename}"
    video_path = os.path.join(uploads_dir, video_filename)
    video_file.save(video_path)

    # Extract frames using ffmpeg into a unique directory
    frames_dir = os.path.join('frames', os.path.splitext(video_filename)[0])
    os.makedirs(frames_dir, exist_ok=True)
    ffmpeg_command = [
        "ffmpeg", "-i", video_path,
        os.path.join(frames_dir, "frame_%04d.jpg")
    ]
    subprocess.run(ffmpeg_command, check=True)

    # Process frames and annotations to create a dataset file
    dataset_file = os.path.join('datasets', f"{os.path.splitext(video_filename)[0]}.data")
    os.makedirs('datasets', exist_ok=True)
    with open(dataset_file, "wb") as out_file:
        # Iterate through frames (assumes sequential naming)
        frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.jpg')])
        # For demonstration, assume a fixed frame rate
        frame_rate = 30  # adjust as necessary
        for i, frame in enumerate(frame_files):
            # Calculate the timestamp for the frame (in seconds)
            timestamp = i / frame_rate
            # Determine the label for this frame based on annotations
            frame_label = None
            for ann in annotations:
                if ann['startTime'] <= timestamp <= ann['endTime']:
                    # Use the label’s number for the dataset (or adjust as needed)
                    frame_label = int(ann['labelId'])
                    break
            if frame_label is None:
                frame_label = -1  # or a default label for 'unlabeled'
            # Read the binary frame data
            with open(os.path.join(frames_dir, frame), "rb") as img_file:
                binary_data = img_file.read()
            # Write length, binary data, and label to the dataset file.
            out_file.write(len(binary_data).to_bytes(4, byteorder='little'))
            out_file.write(binary_data)
            out_file.write(frame_label.to_bytes(4, byteorder='little', signed=True))
    
    # Return a link for the user to download the file
    return jsonify({'downloadUrl': f'/api/download/{os.path.basename(dataset_file)}'})

@app.route('/api/download/<filename>', methods=['GET'])
def download_dataset(filename):
    return send_file(os.path.join('datasets', filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
