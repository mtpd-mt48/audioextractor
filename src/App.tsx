import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Download, Music, AlertCircle } from 'lucide-react';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = new FFmpeg();
      ffmpegInstance.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpeg(ffmpegInstance);
    };
    loadFFmpeg();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setAudioUrl(null);
      setError(null);
    }
  };

  const extractAudio = async () => {
    if (!videoFile || !ffmpeg) return;

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
      const audioBlob = new Blob([data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
    } catch (err) {
      console.error(err);
      setError('An error occurred during audio extraction. Please try again.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Video to Audio Extractor</h1>
        
        <div className="mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
          >
            <Upload className="mr-2" size={20} />
            {videoFile ? 'Change Video' : 'Upload Video'}
          </button>
          {videoFile && (
            <p className="mt-2 text-sm text-gray-600 text-center">{videoFile.name}</p>
          )}
        </div>

        {videoFile && (
          <button
            onClick={extractAudio}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300 flex items-center justify-center mb-4"
          >
            <Music className="mr-2" size={20} />
            Extract Audio
          </button>
        )}

        {progress > 0 && progress < 100 && (
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">Processing: {progress}%</p>
          </div>
        )}

        {audioUrl && (
          <div className="mb-4">
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <a
              href={audioUrl}
              download="extracted_audio.mp3"
              className="mt-4 w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition duration-300 flex items-center justify-center"
            >
              <Download className="mr-2" size={20} />
              Download Audio
            </a>
          </div>
        )}

        {error && (
          <div className="text-red-500 flex items-center justify-center mt-4">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;