// src/components/CameraCapture.tsx

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (photo: string) => void;
  onBack?: () => void;
}

export const CameraCapture = ({ onCapture, onBack }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedPhoto(photoData);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const usePhoto = () => {
    if (capturedPhoto) onCapture(capturedPhoto);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-3">Take Your Photo</h2>
        <p className="text-xl text-muted-foreground">Please center your face in the frame, then tap Capture</p>
      </div>

      <div className="relative bg-muted rounded-2xl overflow-hidden aspect-video mb-8">
        {capturedPhoto ? (
          <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <p className="text-xl text-muted-foreground">Loading camera...</p>
              </div>
            )}
            <div className="absolute inset-0 border-4 border-primary/30 rounded-2xl pointer-events-none" />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ✅ Bottom row: Back on left, action on right */}
      <div className="flex items-center justify-between gap-6">
        <div>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="lg" className="h-16 px-10 text-xl">
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-6">
          {capturedPhoto ? (
            <>
              <Button onClick={retake} variant="outline" size="lg" className="h-16 px-10 text-xl">
                <RotateCcw className="mr-3 w-6 h-6" />
                Retake
              </Button>
              <Button onClick={usePhoto} size="lg" className="h-16 px-10 text-xl">
                <Check className="mr-3 w-6 h-6" />
                Use Photo
              </Button>
            </>
          ) : (
            <Button onClick={capturePhoto} size="lg" className="h-16 px-12 text-xl" disabled={!isCameraReady}>
              <Camera className="mr-3 w-6 h-6" />
              Capture Photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
