import { Camera, CheckCircle, Clock, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import axios from 'axios';

const QR = () => {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [frame, setFrame] = useState('');
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [canScan, setCanScan] = useState(true);
  const [timeUntilNextScan, setTimeUntilNextScan] = useState(0);

  const scanInterval = useRef(null);
  const audioRef = useRef(null);

  const API_BASE = 'http://localhost:5001/api';

  // 🔊 Play sound from /public/test.mp3
  const playBeep = () => {
    if (!soundEnabled || !audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.volume = 1; // Adjust volume (0.0 - 1.0)
    audioRef.current.play().catch((err) => {
      console.warn('Audio play error:', err);
    });
  };

  // 📸 Get available cameras
  const getCameras = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cameras`);
      setCameras(response.data.cameras);
    } catch (err) {
      console.error('Error getting cameras:', err);
    }
  };

  // ▶ Start camera
  const startCamera = async () => {
    try {
      setError('');
      const response = await axios.post(`${API_BASE}/camera/start`, {
        camera_index: selectedCamera,
      });

      if (response.data.success) {
        setScanning(true);
        startScanning();
      } else {
        setError('Failed to start camera');
      }
    } catch (err) {
      setError('Error starting camera: ' + err.message);
    }
  };

  // ⏹ Stop camera
  const stopCamera = async () => {
    try {
      await axios.post(`${API_BASE}/camera/stop`);
      setScanning(false);
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
  };

  // 🔁 Start scanning loop
  const startScanning = () => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
    }

    scanInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE}/camera/scan`);

        if (response.data.success) {
          setFrame(response.data.frame);
          setCanScan(response.data.can_scan);
          setTimeUntilNextScan(response.data.time_until_next_scan);

          // ✅ Play sound for successful scan
          if (response.data.results.length > 0) {
            setScanResults((prev) => [...response.data.results, ...prev].slice(0, 10));
            playBeep();
          }
        }
      } catch (err) {
        console.error('Error scanning:', err);
      }
    }, 100);
  };

  // ⚡ Initialize on mount
  useEffect(() => {
    getCameras();
    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, []);

  const toggleCamera = () => {
    if (scanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const clearResults = () => {
    setScanResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">QR Code Scanner</h1>
 
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Camera Controls */}
              <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={scanning}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.index} value={camera.index}>
                        {camera.name} ({camera.resolution})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      soundEnabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Clear
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      scanning
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Camera size={16} />
                    {scanning ? 'Stop Scanner' : 'Start Scanner'}
                  </button>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                {frame ? (
                  <img src={frame} alt="Camera feed" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Camera size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg opacity-75">
                        {scanning ? 'Starting camera...' : 'Camera feed will appear here'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cooldown Overlay */}
                {scanning && !canScan && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Clock size={48} className="mx-auto mb-4 animate-pulse" />
                      <div className="text-2xl font-bold mb-2">
                        {timeUntilNextScan.toFixed(1)}s
                      </div>
                      <p>Next scan available in</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Info */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div
                  className={`px-3 py-1 rounded-full ${
                    scanning
                      ? canScan
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Status: {scanning ? (canScan ? 'Ready to scan' : 'Cooling down') : 'Stopped'}
                </div>

                <div
                  className={`px-3 py-1 rounded-full ${
                    soundEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Sound: {soundEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Scan Results</h2>
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
                {scanResults.length}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanResults.length > 0 ? (
                scanResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium bg-green-200 text-green-800 px-2 py-1 rounded">
                            {result.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-gray-800 break-all">{result.data}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No scans yet</p>
                  <p className="text-sm">Start scanning to see results here</p>
                </div>
              )}
            </div>

            {/* Scan Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Scanning Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Cooldown:</span>
                  <span className="font-medium">5 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Status:</span>
                  <span
                    className={`font-medium ${canScan ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {canScan ? 'Ready' : 'Cooling down'}
                  </span>
                </div>
                {!canScan && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">Next scan:</span>
                    <span className="font-medium text-yellow-600">
                      {timeUntilNextScan.toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🔊 Hidden Audio Element */}
        <audio ref={audioRef} src="/test.mp3" preload="auto" />
      </div>
    </div>
  );
};

export default QR;
