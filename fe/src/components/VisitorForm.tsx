// fe/src/components/VisitorForm.tsx

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { kioskHosts, type Host as ApiHost } from "@/services/kioskApi";

interface VisitorFormProps {
  onNext: (data: VisitorFormData, hostEmail?: string) => void; // keep 2nd arg for compatibility
  onBack?: () => void;
}

export interface VisitorFormData {
  firstName: string;
  lastName: string;
  reasonForVisit: string;
  hostName: string;   // REQUIRED
  hostEmail: string;  // REQUIRED (drives notifications)
}

export const VisitorForm = ({ onNext, onBack }: VisitorFormProps) => {
  const [formData, setFormData] = useState<Omit<VisitorFormData, "hostEmail">>({
    firstName: "",
    lastName: "",
    reasonForVisit: "",
    hostName: "",
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    reasonForVisit: false,
    host: false,
  });

  const [hosts, setHosts] = useState<ApiHost[]>([]);
  const [selectedHost, setSelectedHost] = useState<ApiHost | null>(null);
  const [hostDropdownOpen, setHostDropdownOpen] = useState(false);
  const [loadingHosts, setLoadingHosts] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingHosts(true);
      try {
        const data = await kioskHosts();
        // /kiosk/hosts should already be active-only, so do NOT filter by is_active here
        setHosts(data || []);
      } catch (e) {
        console.error("Error fetching hosts:", e);
        setHosts([]);
      } finally {
        setLoadingHosts(false);
      }
    })();
  }, []);

  const sortedHosts = useMemo(() => {
    return [...hosts].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [hosts]);

  const handleHostSelect = (host: ApiHost) => {
    setSelectedHost(host);
    setFormData({ ...formData, hostName: host.name });
    setErrors({ ...errors, host: false });
    setHostDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      reasonForVisit: !formData.reasonForVisit.trim(),
      host: !selectedHost || !selectedHost.email?.trim(),
    };

    setErrors(newErrors);

    // must have hosts available AND a selected host
    if (hosts.length === 0 || loadingHosts) return;

    if (!newErrors.firstName && !newErrors.lastName && !newErrors.reasonForVisit && !newErrors.host) {
      const payload: VisitorFormData = {
        ...formData,
        hostEmail: selectedHost!.email,
      };

      // pass email as 2nd arg to keep Index.tsx compatibility
      onNext(payload, selectedHost!.email);
    }
  };

  const canProceed =
    !loadingHosts &&
    hosts.length > 0 &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.reasonForVisit.trim() &&
    selectedHost &&
    selectedHost.email?.trim();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold mb-4">Welcome to Graves Foods!</h1>
        <p className="text-2xl text-muted-foreground">Please check in below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <Label htmlFor="firstName" className="text-xl font-semibold">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              setErrors({ ...errors, firstName: false });
            }}
            className={`text-2xl h-16 ${errors.firstName ? "border-destructive" : ""}`}
            placeholder="Enter your first name"
          />
          {errors.firstName && <p className="text-destructive text-sm">First name is required</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="lastName" className="text-xl font-semibold">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              setErrors({ ...errors, lastName: false });
            }}
            className={`text-2xl h-16 ${errors.lastName ? "border-destructive" : ""}`}
            placeholder="Enter your last name"
          />
          {errors.lastName && <p className="text-destructive text-sm">Last name is required</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="reasonForVisit" className="text-xl font-semibold">
            Reason for Visit <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reasonForVisit"
            value={formData.reasonForVisit}
            onChange={(e) => {
              setFormData({ ...formData, reasonForVisit: e.target.value });
              setErrors({ ...errors, reasonForVisit: false });
            }}
            className={`text-xl min-h-[120px] resize-none ${errors.reasonForVisit ? "border-destructive" : ""}`}
            placeholder="e.g., Meeting, Interview, Delivery"
          />
          {errors.reasonForVisit && <p className="text-destructive text-sm">Reason for visit is required</p>}
        </div>

        <div className="space-y-3">
          <Label className="text-xl font-semibold">
            Who are you visiting? <span className="text-destructive">*</span>
          </Label>

          {loadingHosts ? (
            <div className="text-muted-foreground text-lg">Loading host directory...</div>
          ) : hosts.length === 0 ? (
            <div className="border rounded-lg p-4 bg-muted">
              <p className="text-lg font-semibold">No hosts are available.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please notify the front desk. An admin must add/activate hosts so notifications can be sent.
              </p>
            </div>
          ) : (
            <>
              <Collapsible open={hostDropdownOpen} onOpenChange={setHostDropdownOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-16 text-2xl justify-between ${errors.host ? "border-destructive" : ""}`}
                  >
                    <span className={selectedHost ? "text-foreground" : "text-muted-foreground"}>
                      {selectedHost ? selectedHost.name : "Select a host..."}
                    </span>
                    {hostDropdownOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2">
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {sortedHosts.map((host) => (
                      <button
                        key={host.id}
                        type="button"
                        onClick={() => handleHostSelect(host)}
                        className="w-full px-4 py-3 text-left text-lg hover:bg-muted border-b last:border-b-0"
                      >
                        <div className="font-medium">{host.name}</div>
                        <div className="text-sm text-muted-foreground">{host.email}</div>
                        {host.department && <div className="text-sm text-muted-foreground">{host.department}</div>}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {errors.host && (
                <p className="text-destructive text-sm">Please select a host (required for notifications).</p>
              )}

              <p className="text-sm text-muted-foreground">Don’t see your host? Please contact the front desk.</p>
            </>
          )}
        </div>

        {/* ✅ Bottom row: Back on left, Next on right */}
        <div className="pt-6 flex items-center justify-between">
          <div>
            {onBack && (
              <Button type="button" variant="outline" size="lg" className="h-16 px-10 text-xl" onClick={onBack}>
                Back
              </Button>
            )}
          </div>

          <Button type="submit" size="lg" className="h-16 px-12 text-xl" disabled={!canProceed}>
            Next: Take Photo
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
        </div>
      </form>
    </div>
  );
};
