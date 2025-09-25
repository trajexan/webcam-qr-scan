import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

type ScannerStatus = 'initializing' | 'scanning' | 'detected' | 'error' | 'no-camera';

const QRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [status, setStatus] = useState<ScannerStatus>('initializing');
  const [result, setResult] = useState('');
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [isScanning, setIsScanning] = useState(false);

  const updateStatus = useCallback((newStatus: ScannerStatus, message: string) => {
    setStatus(newStatus);
    setStatusMessage(message);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        updateStatus('scanning', 'Scanning for QR code...');
      }
    } catch (error) {
      console.error('Camera access error:', error);
      updateStatus('no-camera', 'Camera access denied or not available');
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [updateStatus]);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setResult(code.data);
      updateStatus('detected', 'QR code detected and decoded!');
      toast({
        title: "QR Code Found!",
        description: "Successfully decoded QR code",
      });
    } else {
      if (status !== 'scanning') {
        updateStatus('scanning', 'Scanning for QR code...');
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  }, [isScanning, status, updateStatus]);

  const handleSubmit = () => {
    if (result) {
      console.log('QR Code Result:', result);
      toast({
        title: "Result Submitted",
        description: `Logged to console: ${result}`,
      });
      alert(`QR Code Result: ${result}`);
    } else {
      toast({
        title: "No Result",
        description: "Please scan a QR code first",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (isScanning) {
      scanQRCode();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, scanQRCode]);

  const getStatusColor = () => {
    switch (status) {
      case 'detected': return 'text-scanner-success';
      case 'error':
      case 'no-camera': return 'text-scanner-error';
      case 'scanning': return 'text-scanner-glow';
      default: return 'text-scanner-warning';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto scanner-pulse border-scanner-glow/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-scanner-glow to-scanner-secondary bg-clip-text text-transparent">
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Video Container */}
          <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            {status === 'scanning' && (
              <div className="absolute inset-0 border-2 border-scanner-glow/30 rounded-lg">
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-scanner-glow to-transparent scanner-scan"></div>
                <div className="absolute inset-4 border border-scanner-glow/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-scanner-glow rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-scanner-glow rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-scanner-glow rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-scanner-glow rounded-br-lg"></div>
                </div>
              </div>
            )}
            
            {/* Success Overlay */}
            {status === 'detected' && (
              <div className="absolute inset-0 bg-scanner-success/10 border-2 border-scanner-success rounded-lg flex items-center justify-center">
                <div className="text-scanner-success text-4xl">✓</div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Result Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Decoded Result:</label>
            <Input
              value={result}
              placeholder="QR code result will appear here..."
              readOnly
              className="bg-muted/50 border-scanner-glow/20 focus:border-scanner-glow"
            />
          </div>

          {/* Status Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Status:</label>
            <div className={`p-3 rounded-lg bg-muted/30 border border-border/50 ${getStatusColor()} font-medium text-center transition-colors duration-300`}>
              {statusMessage}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full gradient-scanner hover:scale-105 transition-transform duration-200 font-semibold text-lg py-6"
            disabled={!result}
          >
            Submit Result
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;