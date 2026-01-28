// fe/src/components/CheckOutPanel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CheckOutScanner from './CheckOutScanner';
import { checkOutByCode } from '@/services/kioskApi';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CheckOutPanel({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [visitor, setVisitor] = useState<any>(null);

  const handleCode = async (code: string) => {
    setStatus('processing');
    try {
      const res = await checkOutByCode(code.trim());
      setVisitor(res.visitor);
      setStatus('success');
      toast.success('Checked out successfully');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      toast.error(e.message || 'Checkout failed');
    }
  };

  if (status === 'success') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Checked Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-xl font-semibold">{visitor?.full_name}</div>
          <div className="text-muted-foreground">
            Check-in: {visitor?.check_in_time ? format(new Date(visitor.check_in_time), 'MMM d, yyyy h:mm a') : '—'}
            <br />
            Check-out: {visitor?.check_out_time ? format(new Date(visitor.check_out_time), 'MMM d, yyyy h:mm a') : '—'}
          </div>
          <Button size="lg" className="h-16 px-12 text-xl" onClick={onDone}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="w-6 h-6" /> Couldn’t Check Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">Try scanning again.</p>
          <Button size="lg" className="h-16 px-12 text-xl" onClick={() => setStatus('scanning')}>
            Scan Again
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-12 text-xl" onClick={onDone}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">Check Out</h2>
        <p className="text-xl text-muted-foreground">Scan your badge to sign out</p>
      </div>

      {status === 'processing' ? (
        <div className="flex items-center justify-center gap-3 text-xl text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <CheckOutScanner onCode={handleCode} paused={status !== 'scanning'} />
      )}

      <div className="flex justify-center">
        <Button variant="outline" size="lg" className="h-16 px-12 text-xl" onClick={onDone}>
          Back
        </Button>
      </div>
    </div>
  );
}
