// fe/src/components/admin/VisitorLogsTable.tsx

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Loader2, Search, CheckCircle, XCircle, Trash2, Eye, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  deleteVisitorLog,
  getVisitorLog,
  listVisitorLogs,
  checkOutVisitorLog,
  VisitorLog,
  VisitorLogDetails,
} from '@/services/adminApi';

export const VisitorLogsTable = () => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Checkout dialog state
  const [checkoutTarget, setCheckoutTarget] = useState<{ id: string; name: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // View dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewLog, setViewLog] = useState<VisitorLogDetails | null>(null);

  const fetchLogs = async (q?: string) => {
    setLoading(true);
    try {
      const data = await listVisitorLogs(q?.trim() ? q.trim() : undefined);
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching visitor logs:', err);
      toast.error(err?.message || 'Failed to load visitor logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter((log) => {
      return (
        log.full_name.toLowerCase().includes(s) ||
        log.reason_for_visit.toLowerCase().includes(s) ||
        (log.host_name?.toLowerCase() || '').includes(s)
      );
    });
  }, [logs, search]);

  const openDelete = (id: string, name: string) => setDeleteTarget({ id, name });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVisitorLog(deleteTarget.id);
      setLogs((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success('Visitor log deleted');
      setDeleteTarget(null);

      // if the view dialog is open on the same visitor, close it
      if (viewLog?.id === deleteTarget.id) {
        setViewOpen(false);
        setViewLog(null);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err?.message || 'Failed to delete visitor log');
    } finally {
      setDeleting(false);
    }
  };

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewLog(null);

    try {
      const data = await getVisitorLog(id);
      setViewLog(data);
    } catch (err: any) {
      console.error('View failed:', err);
      toast.error(err?.message || 'Failed to load visitor details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openCheckout = (id: string, name: string) => setCheckoutTarget({ id, name });

  const confirmCheckout = async () => {
    if (!checkoutTarget) return;
    setCheckingOut(true);
    try {
      const res = await checkOutVisitorLog(checkoutTarget.id);

      // update list row in-place
      setLogs((prev) =>
        prev.map((x) =>
          x.id === checkoutTarget.id
            ? { ...x, check_out_time: res.visitor.check_out_time }
            : x
        )
      );

      // update view dialog if open
      setViewLog((prev) =>
        prev && prev.id === checkoutTarget.id
          ? { ...prev, check_out_time: res.visitor.check_out_time }
          : prev
      );

      toast.success('Visitor checked out');
      setCheckoutTarget(null);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      toast.error(err?.message || 'Failed to check out visitor');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Recent Visitors</CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Button variant="outline" onClick={() => fetchLogs(search)} title="Refresh">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'No visitors match your search' : 'No visitor logs yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead className="text-center">Badge</TableHead>
                  <TableHead className="text-center">Notified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.map((log) => {
                  const canCheckout = !log.check_out_time;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.full_name}</TableCell>

                      <TableCell className="max-w-[220px] truncate">{log.reason_for_visit}</TableCell>

                      <TableCell>
                        {log.host_name ? log.host_name : <Badge variant="secondary">Walk-in</Badge>}
                      </TableCell>

                      <TableCell>{format(new Date(log.check_in_time), 'MMM d, yyyy h:mm a')}</TableCell>

                      <TableCell>
                        {log.check_out_time ? format(new Date(log.check_out_time), 'MMM d, yyyy h:mm a') : '—'}
                      </TableCell>

                      <TableCell className="text-center">
                        {log.badge_printed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {log.notification_sent ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openView(log.id)}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCheckout(log.id, log.full_name)}
                            title="Check Out"
                            disabled={!canCheckout}
                          >
                            <LogOut className={`w-4 h-4 ${canCheckout ? '' : 'opacity-50'}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(log.id, log.full_name)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* In-app Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete visitor log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the visitor log for{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ In-app Check Out Confirm */}
      <AlertDialog open={!!checkoutTarget} onOpenChange={(open) => !open && setCheckoutTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check out visitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the check-out time for{' '}
              <span className="font-semibold">{checkoutTarget?.name}</span> to now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckout} disabled={checkingOut}>
              {checkingOut ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking out
                </span>
              ) : (
                'Check Out'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Visitor Details */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !viewLog ? (
            <div className="py-6 text-muted-foreground">No details available.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo */}
                <div className="md:col-span-1">
                  <div className="rounded-lg border overflow-hidden bg-muted">
                    {viewLog.photo_url ? (
                      <img
                        src={viewLog.photo_url}
                        alt={viewLog.full_name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <div className="text-2xl font-semibold">{viewLog.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Graves Foods - Jefferson City, MO
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Reason</div>
                      <div className="font-medium">{viewLog.reason_for_visit}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Host</div>
                      <div className="font-medium">{viewLog.host_name ?? 'WALK-IN'}</div>
                      {viewLog.host_email ? (
                        <div className="text-sm text-muted-foreground">{viewLog.host_email}</div>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Check-in</div>
                      <div className="font-medium">
                        {format(new Date(viewLog.check_in_time), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Check-out</div>
                      <div className="font-medium">
                        {viewLog.check_out_time
                          ? format(new Date(viewLog.check_out_time), 'MMM d, yyyy h:mm a')
                          : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Badge Printed</div>
                      <div className="font-medium">{viewLog.badge_printed ? 'Yes' : 'No'}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Host Notified</div>
                      <div className="font-medium">{viewLog.notification_sent ? 'Yes' : 'No'}</div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="text-xs uppercase text-muted-foreground">Badge Code</div>
                      <div className="font-mono text-sm">{viewLog.badge_code ?? '—'}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    {!viewLog.check_out_time && (
                      <Button
                        variant="outline"
                        onClick={() => openCheckout(viewLog.id, viewLog.full_name)}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out Visitor
                      </Button>
                    )}

                    <Button variant="outline" onClick={() => setViewOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
