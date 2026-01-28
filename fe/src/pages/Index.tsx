// fe/src/pages/Index.tsx

import { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { VisitorForm, VisitorFormData } from "@/components/VisitorForm";
import { CameraCapture } from "@/components/CameraCapture";
import { BadgePreview } from "@/components/BadgePreview";
import { Button } from "@/components/ui/button";
import { Settings, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CheckOutPanel from "@/components/CheckOutPanel";

type Mode = "menu" | "checkin" | "checkout";

const Index = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("menu");

  // check-in state
  const [currentStep, setCurrentStep] = useState(1);
  const [visitorData, setVisitorData] = useState<VisitorFormData | null>(null);
  const [hostEmail, setHostEmail] = useState<string | undefined>(undefined);
  const [photo, setPhoto] = useState<string | null>(null);

  const resetCheckIn = () => {
    setCurrentStep(1);
    setVisitorData(null);
    setHostEmail(undefined);
    setPhoto(null);
  };

  const handleFormComplete = (data: VisitorFormData, email?: string) => {
    setVisitorData(data);
    // prefer data.hostEmail, fallback to 2nd arg for compatibility
    setHostEmail(data.hostEmail || email);
    setCurrentStep(2);
  };

  const handlePhotoCapture = (photoData: string) => {
    setPhoto(photoData);
    setCurrentStep(3);
  };

  const handleComplete = () => {
    resetCheckIn();
    setMode("menu");
  };

  // Back button behavior depending on step
  const handleBack = () => {
    if (mode === "checkout") return setMode("menu");
    if (mode === "checkin") {
      if (currentStep === 1) return setMode("menu");
      if (currentStep === 2) return setCurrentStep(1);
      if (currentStep === 3) return setCurrentStep(2);
    }
    setMode("menu");
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      {/* Admin link */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 opacity-30 hover:opacity-100"
        onClick={() => navigate("/admin")}
      >
        <Settings className="w-5 h-5" />
      </Button>

      <div className="flex-1 flex flex-col items-center justify-center">
        {mode === "menu" && (
          <div className="w-full max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-3">Welcome to Graves Foods!</h1>
              <p className="text-2xl text-muted-foreground">Select an option</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                size="lg"
                className="h-28 text-3xl font-semibold"
                onClick={() => {
                  resetCheckIn();
                  setMode("checkin");
                }}
              >
                <LogIn className="w-8 h-8 mr-3" />
                Check In
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-28 text-3xl font-semibold"
                onClick={() => setMode("checkout")}
              >
                <LogOut className="w-8 h-8 mr-3" />
                Check Out
              </Button>
            </div>
          </div>
        )}

        {mode === "checkout" && <CheckOutPanel onDone={() => setMode("menu")} />}

        {mode === "checkin" && (
          <div className="w-full">
            <StepIndicator currentStep={currentStep} />

            <div className="flex-1 flex items-center justify-center mt-8">
              {currentStep === 1 && (
                <VisitorForm
                  onNext={handleFormComplete}
                  onBack={handleBack}
                />
              )}

              {currentStep === 2 && (
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  onBack={handleBack}
                />
              )}

              {currentStep === 3 && visitorData && photo && (
                <BadgePreview
                  visitorData={visitorData}
                  photo={photo}
                  hostEmail={hostEmail}
                  onComplete={handleComplete}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
