// src/components/admin/HostsManagement.tsx

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listHosts,
  createHost,
  updateHost,
  setHostActive,
  deleteHost,
  type Host,
} from '@/services/adminApi';

interface HostsManagementProps {
  onHostsChange: () => void;
}

export const HostsManagement = ({ onHostsChange }: HostsManagementProps) => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: '' });
  const [saving, setSaving] = useState(false);

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const data = await listHosts();
      setHosts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Error fetching hosts:', e);
      toast.error(e?.message || 'Failed to load hosts');
      setHosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleOpenDialog = (host?: Host) => {
    if (host) {
      setEditingHost(host);
      setFormData({ name: host.name, email: host.email, department: host.department || '' });
    } else {
      setEditingHost(null);
      setFormData({ name: '', email: '', department: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setSaving(true);
    try {
      if (editingHost) {
        await updateHost(editingHost.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department.trim() || null,
        });
        toast.success('Host updated successfully');
      } else {
        await createHost({
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department.trim() || null,
        });
        toast.success('Host added successfully');
      }

      setDialogOpen(false);
      await fetchHosts();
      onHostsChange();
    } catch (e: any) {
      console.error('Error saving host:', e);
      toast.error(e?.message || 'Failed to save host');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (host: Host) => {
    try {
      await setHostActive(host.id, !host.is_active);
      setHosts(hosts.map(h => (h.id === host.id ? { ...h, is_active: !h.is_active } : h)));
      onHostsChange();
      toast.success(`Host ${host.is_active ? 'deactivated' : 'activated'}`);
    } catch (e: any) {
      console.error('Error toggling host status:', e);
      toast.error(e?.message || 'Failed to update host status');
    }
  };

  const handleDelete = async (host: Host) => {
    if (!confirm(`Are you sure you want to delete ${host.name}?`)) return;

    try {
      await deleteHost(host.id);
      setHosts(hosts.filter(h => h.id !== host.id));
      onHostsChange();
      toast.success('Host deleted successfully');
    } catch (e: any) {
      console.error('Error deleting host:', e);
      toast.error(e?.message || 'Failed to delete host');
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Host Directory</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hosts will receive email notifications when visitors arrive
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Host
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHost ? 'Edit Host' : 'Add New Host'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingHost ? 'Update' : 'Add'} Host
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {hosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hosts configured yet</p>
            <p className="text-sm mt-1">Add hosts to enable email notifications when visitors arrive</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell>{host.email}</TableCell>
                  <TableCell>{host.department || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={host.is_active} onCheckedChange={() => handleToggleActive(host)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(host)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(host)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
