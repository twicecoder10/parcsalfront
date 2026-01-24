'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Loader2, Search } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type {
  AdminFeedback,
  ContactMessage,
  ContactMessagePagination,
  ContactMessageStatus,
  FeedbackApp,
  FeedbackListResponse,
  FeedbackStatus,
  FeedbackType,
} from '@/lib/admin-api';

const feedbackStatusColors: Record<FeedbackStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

const contactStatusColors: Record<ContactMessageStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  READ: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

const DEFAULT_CONTACT_PAGINATION: ContactMessagePagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

type SupportInboxProps = {
  basePath?: string;
};

export default function SupportInbox({ basePath = '/admin/support' }: SupportInboxProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feedback' | 'contact'>('feedback');

  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackRows, setFeedbackRows] = useState<AdminFeedback[]>([]);
  const [feedbackPagination, setFeedbackPagination] = useState<FeedbackListResponse['pagination']>({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus | 'all'>('all');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | 'all'>('all');
  const [feedbackApp, setFeedbackApp] = useState<FeedbackApp | 'all'>('all');
  const [feedbackPage, setFeedbackPage] = useState(1);

  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactRows, setContactRows] = useState<ContactMessage[]>([]);
  const [contactPagination, setContactPagination] = useState<ContactMessagePagination>(DEFAULT_CONTACT_PAGINATION);
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatus, setContactStatus] = useState<ContactMessageStatus | 'all'>('all');
  const [contactPage, setContactPage] = useState(1);

  const fetchFeedback = useCallback(async () => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      const response = await adminApi.getFeedback({
        limit: 20,
        offset: (feedbackPage - 1) * 20,
        status: feedbackStatus === 'all' ? undefined : feedbackStatus,
        type: feedbackType === 'all' ? undefined : feedbackType,
        app: feedbackApp === 'all' ? undefined : feedbackApp,
      });
      setFeedbackRows(Array.isArray(response.data) ? response.data : []);
      setFeedbackPagination(response.pagination);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackPage, feedbackStatus, feedbackType, feedbackApp]);

  const fetchContactMessages = useCallback(async () => {
    try {
      setContactLoading(true);
      setContactError(null);
      const response = await adminApi.getContactMessages({
        page: contactPage,
        limit: 20,
        status: contactStatus === 'all' ? undefined : contactStatus,
        search: contactSearch || undefined,
      });
      setContactRows(response.data);
      setContactPagination(response.pagination);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to load contact messages');
    } finally {
      setContactLoading(false);
    }
  }, [contactPage, contactStatus, contactSearch]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    fetchContactMessages();
  }, [fetchContactMessages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (contactPage === 1) {
        fetchContactMessages();
      } else {
        setContactPage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [contactSearch, contactPage, fetchContactMessages]);

  const filteredFeedback = useMemo(() => {
    const safeRows = Array.isArray(feedbackRows) ? feedbackRows : [];
    if (!feedbackSearch.trim()) {
      return safeRows;
    }

    const term = feedbackSearch.trim().toLowerCase();
    return safeRows.filter((item) => {
      const userText = [item.user?.fullName, item.user?.email].filter(Boolean).join(' ');
      const companyText = item.company?.name ?? '';
      return (
        item.message.toLowerCase().includes(term) ||
        (item.pageUrl ?? '').toLowerCase().includes(term) ||
        userText.toLowerCase().includes(term) ||
        companyText.toLowerCase().includes(term)
      );
    });
  }, [feedbackRows, feedbackSearch]);

  const feedbackStart = feedbackPagination.total === 0 ? 0 : feedbackPagination.offset + 1;
  const feedbackEnd = Math.min(feedbackPagination.offset + feedbackPagination.limit, feedbackPagination.total);
  const contactStart = contactPagination.total === 0 ? 0 : (contactPage - 1) * contactPagination.limit + 1;
  const contactEnd = Math.min(contactPage * contactPagination.limit, contactPagination.total);
  const feedbackIsLoading = feedbackLoading && feedbackRows.length === 0;
  const feedbackHasError = Boolean(feedbackError);
  const feedbackIsEmpty = !feedbackIsLoading && !feedbackHasError && filteredFeedback.length === 0;
  const contactIsLoading = contactLoading && contactRows.length === 0;
  const contactHasError = Boolean(contactError);
  const contactIsEmpty = !contactIsLoading && !contactHasError && contactRows.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Support Inbox</h1>
        <p className="mt-2 text-gray-600">Manage feedback reports and contact form messages</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 sm:mx-auto sm:justify-center">
          <TabsTrigger value="feedback" className="w-full">
            Feedback
          </TabsTrigger>
          <TabsTrigger value="contact" className="w-full">
            Contact Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search message, user, or page URL..."
                    className="pl-10"
                    value={feedbackSearch}
                    onChange={(event) => setFeedbackSearch(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 md:flex md:gap-4">
                  <Select
                    value={feedbackStatus}
                    onValueChange={(value) => {
                      setFeedbackStatus(value as FeedbackStatus | 'all');
                      setFeedbackPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_REVIEW">In review</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={feedbackType}
                    onValueChange={(value) => {
                      setFeedbackType(value as FeedbackType | 'all');
                      setFeedbackPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="BUG">Bug</SelectItem>
                      <SelectItem value="FEATURE">Feature</SelectItem>
                      <SelectItem value="COMPLAINT">Complaint</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={feedbackApp}
                    onValueChange={(value) => {
                      setFeedbackApp(value as FeedbackApp | 'all');
                      setFeedbackPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="App" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Apps</SelectItem>
                      <SelectItem value="WEB">Web</SelectItem>
                      <SelectItem value="MOBILE">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback Reports</CardTitle>
              <CardDescription>Latest feedback submitted by users and companies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 sm:hidden">
                {feedbackIsLoading ? (
                  <div className="flex items-center justify-center rounded-lg border py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                ) : feedbackHasError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {feedbackError}
                  </div>
                ) : feedbackIsEmpty ? (
                  <div className="rounded-lg border px-4 py-6 text-center text-sm text-gray-500">
                    No feedback found
                  </div>
                ) : (
                  filteredFeedback.map((feedback) => (
                    <Link
                      key={feedback.id}
                      href={`${basePath}/feedback/${feedback.id}`}
                      className="block rounded-lg border p-4 shadow-sm transition hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{feedback.type}</p>
                          <p className="text-xs text-gray-500">Source: {feedback.app}</p>
                        </div>
                        <Badge className={feedbackStatusColors[feedback.status]}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{feedback.user?.fullName || 'Guest'}</p>
                        <p className="text-gray-500">
                          {feedback.user?.email || feedback.company?.name || 'N/A'}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="hidden w-full overflow-x-auto sm:block">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackIsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                        </TableCell>
                      </TableRow>
                    ) : feedbackHasError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-red-600">
                          {feedbackError}
                        </TableCell>
                      </TableRow>
                    ) : feedbackIsEmpty ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No feedback found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeedback.map((feedback) => (
                        <TableRow
                          key={feedback.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`${basePath}/feedback/${feedback.id}`)}
                        >
                          <TableCell className="font-medium">{feedback.type}</TableCell>
                          <TableCell>
                            <Badge className={feedbackStatusColors[feedback.status]}>
                              {feedback.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{feedback.app}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{feedback.user?.fullName || 'Guest'}</p>
                              <p className="text-gray-500">{feedback.user?.email || feedback.company?.name || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(feedback.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`${basePath}/feedback/${feedback.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {feedbackPagination.total > 0 && (
              <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Showing {feedbackStart} to {feedbackEnd} of {feedbackPagination.total} feedback items
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackPage((prev) => Math.max(1, prev - 1))}
                    disabled={feedbackPagination.offset === 0 || feedbackLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackPage((prev) => prev + 1)}
                    disabled={!feedbackPagination.hasMore || feedbackLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, subject, or message..."
                    className="pl-10"
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                  />
                </div>
                <Select
                  value={contactStatus}
                  onValueChange={(value) => {
                    setContactStatus(value as ContactMessageStatus | 'all');
                    setContactPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Messages</CardTitle>
              <CardDescription>Messages submitted through the contact form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 sm:hidden">
                {contactIsLoading ? (
                  <div className="flex items-center justify-center rounded-lg border py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                ) : contactHasError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {contactError}
                  </div>
                ) : contactIsEmpty ? (
                  <div className="rounded-lg border px-4 py-6 text-center text-sm text-gray-500">
                    No contact messages found
                  </div>
                ) : (
                  contactRows.map((message) => (
                    <Link
                      key={message.id}
                      href={`${basePath}/contact/${message.id}`}
                      className="block rounded-lg border p-4 shadow-sm transition hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{message.name}</p>
                          <p className="text-xs text-gray-500">{message.email}</p>
                        </div>
                        <Badge className={contactStatusColors[message.status]}>
                          {message.status}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">
                          {message.subject || 'No subject'}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="hidden w-full overflow-x-auto sm:block">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactIsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                        </TableCell>
                      </TableRow>
                    ) : contactHasError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-red-600">
                          {contactError}
                        </TableCell>
                      </TableRow>
                    ) : contactIsEmpty ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No contact messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      contactRows.map((message) => (
                        <TableRow
                          key={message.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`${basePath}/contact/${message.id}`)}
                        >
                          <TableCell className="font-medium">{message.name}</TableCell>
                          <TableCell>{message.email}</TableCell>
                          <TableCell className="max-w-[280px] truncate">
                            {message.subject || 'No subject'}
                          </TableCell>
                          <TableCell>
                            <Badge className={contactStatusColors[message.status]}>
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`${basePath}/contact/${message.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {contactPagination.total > 0 && (
              <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Showing {contactStart} to {contactEnd} of {contactPagination.total} messages
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContactPage((prev) => Math.max(1, prev - 1))}
                    disabled={contactPage === 1 || contactLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContactPage((prev) => prev + 1)}
                    disabled={contactPage >= contactPagination.totalPages || contactLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

