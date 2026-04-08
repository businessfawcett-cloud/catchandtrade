'use client';

import { useState, useRef, useEffect } from 'react';

interface Card {
  id: string;
  name: string;
  setname: string;
  setcode: string;
  cardnumber: string;
  rarity: string;
  imageurl: string;
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const API_URL = typeof window !== 'undefined' ? localStorage.getItem('apiUrl') || 'https://catchandtrade.com/api' : 'https://catchandtrade.com/api';

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
      scanCard(dataUrl);
    }
  };

  const scanCard = async (imageData: string) => {
    setLoading(true);
    setError(null);
    setResults([]);

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imageBase64: imageData })
      });

      const data = await response.json();
      
      if (data.success && data.possibleCards) {
        setResults(data.possibleCards);
      } else if (data.recentCards) {
        setResults(data.recentCards);
        setError(data.message || 'No exact matches found. Showing recent cards.');
      } else {
        setError(data.message || 'Could not identify card');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResults([]);
    setError(null);
    startCamera();
  };

  const addToPortfolio = async (card: Card) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login?returnUrl=/scan';
      return;
    }

    try {
      const portfoliosRes = await fetch(`${API_URL}/portfolios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const portfolios = await portfoliosRes.json();
      
      if (!portfolios || portfolios.length === 0) {
        alert('No portfolio found. Please create a portfolio first.');
        return;
      }

      const addRes = await fetch(`${API_URL}/portfolios/${portfolios[0].id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cardId: card.id })
      });

      if (addRes.ok) {
        alert('Card added to portfolio!');
      } else {
        const err = await addRes.json();
        alert(err.error || 'Failed to add card');
      }
    } catch (err) {
      alert('Failed to add card');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        📷 Scan Your Cards
      </h1>
      
      {!stream && !capturedImage && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Point your camera at a Pokemon card to identify it
          </p>
          <button
            onClick={startCamera}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📷 Start Camera
          </button>
          {cameraError && (
            <p style={{ color: '#ef4444', marginTop: '1rem' }}>{cameraError}</p>
          )}
        </div>
      )}

      {stream && (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: '12px' }}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '1rem', 
            left: '50%', 
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={captureImage}
              disabled={isScanning}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isScanning ? 'Scanning...' : '📸 Capture'}
            </button>
            <button
              onClick={stopCamera}
              style={{
                padding: '1rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {capturedImage && (
        <div style={{ marginTop: '1rem' }}>
          <img 
            src={capturedImage} 
            alt="Captured" 
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p>Analyzing card...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fef3c7', 
          borderRadius: '8px',
          color: '#92400e'
        }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Matches Found:</h2>
          {results.map((card) => (
            <div 
              key={card.id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#1a1a2e',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                alignItems: 'center'
              }}
            >
              {card.imageurl && (
                <img 
                  src={card.imageurl} 
                  alt={card.name}
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', color: 'white' }}>{card.name}</p>
                <p style={{ fontSize: '0.875rem', color: '#888' }}>
                  {card.setname} #{card.cardnumber}
                </p>
                {card.rarity && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.125rem 0.5rem',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    color: '#ddd'
                  }}>
                    {card.rarity}
                  </span>
                )}
              </div>
              <button
                onClick={() => addToPortfolio(card)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}

      {capturedImage && !loading && results.length === 0 && !error && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={retakePhoto}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            📷 Take Another Photo
          </button>
        </div>
      )}
    </div>
  );
}