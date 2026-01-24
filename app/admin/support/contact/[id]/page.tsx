'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, User, Calendar, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { ContactMessage, ContactMessageStatus } from '@/lib/admin-api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';

const statusColors: Record<ContactMessageStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  READ: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

export default function ContactMessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [status, setStatus] = useState<ContactMessageStatus>('NEW');

  const fetchMessage = useCallback(async () => {
    if (!params.id || typeof params.id !== 'string') return;

    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getContactMessage(params.id);
      setMessage(data);
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  const handleUpdateStatus = async () => {
    if (!message) return;

    try {
      setSaving(true);
      const updated = await adminApi.updateContactMessageStatus(message.id, status);
      setMessage(updated);
      setStatus(updated.status);
      toast.success('Status updated');
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Message not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Contact Message</h1>
            <p className="mt-2 break-all text-gray-600">Message ID: {message.id}</p>
          </div>
        </div>
        <Badge className={statusColors[message.status]}>
          {message.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={(value) => setStatus(value as ContactMessageStatus)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="READ">Read</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleUpdateStatus}
            className="w-full sm:w-auto"
            disabled={saving || status === message.status}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Status'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Name</p>
              <p className="text-sm text-gray-600">{message.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-600">{message.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Received</p>
              <p className="text-sm text-gray-600">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-sm text-gray-600">Subject</p>
            <p className="text-sm">{message.subject || 'No subject'}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-600">Content</p>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

