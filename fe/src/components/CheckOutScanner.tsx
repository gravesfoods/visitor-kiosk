// fe/src/components/CheckOutScanner.tsx

import { useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

type Props = {
  onCode: (code: string) => void;
  paused?: boolean;
};

export default function CheckOutScanner({ onCode, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (paused) return;

    stoppedRef.current = false;
    const reader = new BrowserQRCodeReader();

    let controls: { stop: () => void } | null = null;

    (async () => {
      try {
        if (!videoRef.current) return;

        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (stoppedRef.current) return;
            if (result) {
              stoppedRef.current = true;
              try {
                controls?.stop();
              } catch {}
              onCode(result.getText());
            }
          },
        );
      } catch (e) {
        // camera permission or device issue
        console.error(e);
      }
    })();

    return () => {
      stoppedRef.current = true;
      try {
        controls?.stop();
      } catch {}
      try {
        reader.reset();
      } catch {}
    };
  }, [onCode, paused]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl overflow-hidden border bg-muted aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      <p className="text-center text-muted-foreground mt-4">
        Hold the badge QR code in front of the camera to check out.
      </p>
    </div>
  );
}
