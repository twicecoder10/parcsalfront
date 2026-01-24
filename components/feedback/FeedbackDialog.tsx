'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';
import { submitFeedback } from '@/lib/feedback-api';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, uploadProofImages, validateImageFile } from '@/lib/upload-api';

type FeedbackType = 'Bug' | 'Feature' | 'Complaint' | 'General';

const FEEDBACK_TYPES: FeedbackType[] = ['Bug', 'Feature', 'Complaint', 'General'];

interface FeedbackDialogProps {
  trigger: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('General');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const maxSizeMb = Math.round(MAX_FILE_SIZE / (1024 * 1024));

  const resetForm = () => {
    setFeedbackType('General');
    setMessage('');
    setRating(null);
    setScreenshotFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setScreenshotFile(null);
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image file.');
      event.target.value = '';
      setScreenshotFile(null);
      return;
    }

    setScreenshotFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter your feedback message.');
      return;
    }

    const parsedRating = rating ? Number(rating) : undefined;
    if (parsedRating && (parsedRating < 1 || parsedRating > 5)) {
      toast.error('Rating must be between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      let attachments: string[] | undefined;
      if (screenshotFile) {
        attachments = await uploadProofImages([screenshotFile]);
      }

      await submitFeedback({
        type: feedbackType,
        message: message.trim(),
        rating: parsedRating,
        attachments,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        app: 'WEB',
      });

      toast.success('Thanks for the feedback!');
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Let us know what&apos;s working and what needs improvement.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Type</Label>
            <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as FeedbackType)}>
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              placeholder="Share details so we can improve."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-rating">Rating (optional)</Label>
            <Select
              value={rating ?? undefined}
              onValueChange={(value) => setRating(value === 'none' ? null : value)}
            >
              <SelectTrigger id="feedback-rating">
                <SelectValue placeholder="Select a rating (1-5)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rating</SelectItem>
                {['1', '2', '3', '4', '5'].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-screenshot">Screenshot (optional)</Label>
            <Input
              ref={fileInputRef}
              id="feedback-screenshot"
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
            />
            {screenshotFile && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs text-gray-600">
                <span className="truncate">{screenshotFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScreenshotFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Max {maxSizeMb}MB. JPG, PNG, GIF, or WebP.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

