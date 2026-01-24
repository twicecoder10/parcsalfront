'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Loader2, Mail, Monitor, Smartphone, User } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { AdminFeedback, FeedbackPriority, FeedbackStatus } from '@/lib/admin-api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';

const statusColors: Record<FeedbackStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

const priorityColors: Record<FeedbackPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [status, setStatus] = useState<FeedbackStatus>('OPEN');
  const [priority, setPriority] = useState<FeedbackPriority>('LOW');

  const fetchFeedback = useCallback(async () => {
    if (!params.id || typeof params.id !== 'string') return;

    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getFeedbackById(params.id);
      setFeedback(data);
      setStatus(data.status);
      setPriority(data.priority);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleUpdate = async () => {
    if (!feedback) return;

    try {
      setSaving(true);
      const updated = await adminApi.updateFeedback(feedback.id, {
        status,
        priority,
      });
      setFeedback(updated);
      setStatus(updated.status);
      setPriority(updated.priority);
      toast.success('Feedback updated');
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to update feedback');
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

  if (error || !feedback) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Feedback not found'}</p>
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
            <h1 className="text-2xl font-bold sm:text-3xl">Feedback Detail</h1>
            <p className="mt-2 break-all text-gray-600">Feedback ID: {feedback.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[feedback.status]}>
            {feedback.status}
          </Badge>
          <Badge className={priorityColors[feedback.priority]}>
            {feedback.priority}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Status & Priority</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_REVIEW">In review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(value) => setPriority(value as FeedbackPriority)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleUpdate}
            className="w-full sm:w-auto"
            disabled={saving || (status === feedback.status && priority === feedback.priority)}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Submitted By</p>
              <p className="text-sm text-gray-600">{feedback.user?.fullName || 'Guest'}</p>
              {feedback.user?.email && (
                <p className="text-sm text-gray-500">{feedback.user.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Type</p>
              <p className="text-sm text-gray-600">{feedback.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {feedback.app === 'MOBILE' ? (
              <Smartphone className="h-5 w-5 text-purple-600" />
            ) : (
              <Monitor className="h-5 w-5 text-purple-600" />
            )}
            <div>
              <p className="font-medium">App</p>
              <p className="text-sm text-gray-600">{feedback.app}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Submitted</p>
              <p className="text-sm text-gray-600">
                {new Date(feedback.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          {feedback.rating && (
            <div>
              <p className="font-medium text-sm text-gray-600">Rating</p>
              <p className="text-sm">{feedback.rating} / 5</p>
            </div>
          )}
          {feedback.pageUrl && (
            <div>
              <p className="font-medium text-sm text-gray-600">Page URL</p>
              <Link href={feedback.pageUrl} target="_blank" className="text-sm text-blue-600 hover:underline">
                {feedback.pageUrl}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
          {feedback.attachments && feedback.attachments.length > 0 && (
            <div>
              <p className="font-medium text-sm text-gray-600">Attachments</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {feedback.attachments.map((url, index) => (
                  <div key={url} className="rounded-lg border bg-white p-2 shadow-sm">
                    <Link href={url} target="_blank" className="block">
                      <div className="relative h-40 w-full overflow-hidden rounded">
                        <Image
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          fill
                          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Attachment {index + 1}</span>
                      <Link href={url} target="_blank" className="text-blue-600 hover:underline">
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

