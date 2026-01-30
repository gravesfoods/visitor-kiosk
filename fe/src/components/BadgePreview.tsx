// fe/src/components/BadgePreview.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { VisitorFormData } from "./VisitorForm";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { printBadge } from "@/services/kioskApi";

interface BadgePreviewProps {
  visitorData: VisitorFormData;
  photo: string;
  hostEmail?: string;
  onComplete: () => void;
}

export const BadgePreview = ({ visitorData, photo, hostEmail, onComplete }: BadgePreviewProps) => {
  const [printStatus, setPrintStatus] = useState<"printing" | "success" | "error">("printing");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [badgeCode, setBadgeCode] = useState<string | null>(null);

  useEffect(() => {
    doPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (printStatus === "success" && countdown === null) {
      const timer = setTimeout(() => setCountdown(15), 2000);
      return () => clearTimeout(timer);
    }
  }, [printStatus, countdown]);

  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        onComplete();
      }
    }
  }, [countdown, onComplete]);

  const doPrint = async () => {
    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const payload = {
      first_name: visitorData.firstName,
      last_name: visitorData.lastName,
      full_name: `${visitorData.firstName} ${visitorData.lastName}`,
      reason_for_visit: visitorData.reasonForVisit,
      host_name: visitorData.hostName || "WALK-IN",
      host_email: hostEmail,
      timestamp,
      photo,
    };

    try {
      const res = await printBadge(payload);

      // Always set badge code if returned (lets the UI show QR for manual assistance)
      if (res?.badge_code) setBadgeCode(res.badge_code);

      if (res?.success) {
        setPrintStatus("success");
        toast.success(res.message || "Badge printed successfully!");
      } else {
        setPrintStatus("error");
        toast.error(res.message || "Unable to print badge. Please notify the front desk.");
      }
    } catch (e: any) {
      console.error(e);
      setPrintStatus("error");
      toast.error(e?.message || "Unable to print badge. Please notify the front desk.");
    }
  };

  const fullName = `${visitorData.firstName} ${visitorData.lastName}`;
  const hostName = visitorData.hostName || "WALK-IN";
  const timestamp = new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-3">Your Visitor Badge</h2>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="bg-badge-bg border-4 border-badge-border rounded-2xl p-8 shadow-2xl w-full max-w-2xl">
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0 space-y-4">
              <img src={photo} alt="Visitor" className="w-48 h-48 object-cover rounded-xl border-2 border-border" />

              <div className="bg-white rounded-xl p-3 border">
                {badgeCode ? (
                  <QRCodeCanvas value={badgeCode} size={160} includeMargin />
                ) : (
                  <div className="w-[160px] h-[160px] flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <div className="text-center text-xs text-muted-foreground mt-2">Scan to Check Out</div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="bg-badge-accent text-primary-foreground px-6 py-3 rounded-lg inline-block">
                <span className="text-2xl font-bold uppercase tracking-wide">VISITOR</span>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{fullName}</h3>
                <p className="text-lg text-muted-foreground">{timestamp}</p>
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Visiting
                </p>
                <p className="text-xl font-semibold text-foreground">{hostName}</p>
              </div>

              {badgeCode && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Badge Code</p>
                  <p className="text-sm font-mono break-all">{badgeCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-6">
        {printStatus === "printing" && (
          <div className="flex items-center justify-center gap-3 text-xl text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Printing your badge...</span>
          </div>
        )}

        {printStatus === "success" && (
          <>
            <div className="flex items-center justify-center gap-3 text-xl text-primary">
              <CheckCircle2 className="w-7 h-7" />
              <span className="font-semibold">Your badge is printing. Please attach it visibly.</span>
            </div>

            {countdown !== null && (
              <>
                <Button onClick={onComplete} size="lg" className="h-20 px-16 text-2xl font-semibold mt-8">
                  Complete Check-In
                </Button>
                <p className="text-base text-muted-foreground">Returning to start in {countdown} seconds...</p>
              </>
            )}
          </>
        )}

        {printStatus === "error" && (
          <>
            <div className="flex items-center justify-center gap-3 text-xl text-destructive">
              <AlertCircle className="w-7 h-7" />
              <span className="font-semibold">We couldn't print your badge. Please notify the front desk.</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Your badge info (including QR/code) is displayed above for manual assistance.
            </p>
            <Button onClick={onComplete} size="lg" className="h-20 px-16 text-2xl font-semibold mt-8">
              Complete Check-In
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
