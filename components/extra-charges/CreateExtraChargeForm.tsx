'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

interface CreateExtraChargeFormProps {
  bookingId: string;
  onSuccess?: () => void;
}

const reasonOptions = [
  { value: 'EXCESS_WEIGHT', label: 'Excess Weight' },
  { value: 'EXTRA_ITEMS', label: 'Extra Items' },
  { value: 'OVERSIZE', label: 'Oversize' },
  { value: 'REPACKING', label: 'Repacking' },
  { value: 'LATE_DROP_OFF', label: 'Late Drop-off' },
  { value: 'OTHER', label: 'Other' },
];

export function CreateExtraChargeForm({ bookingId, onSuccess }: CreateExtraChargeFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: 'EXCESS_WEIGHT' as const,
    description: '',
    evidenceUrls: [] as string[],
    baseAmountMajor: '',
    expiresInHours: '48',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }

    const baseAmount = parseFloat(formData.baseAmountMajor);
    if (!formData.baseAmountMajor || isNaN(baseAmount) || baseAmount <= 0) {
      newErrors.baseAmountMajor = 'Valid base amount is required';
    }

    const expiresInHours = parseInt(formData.expiresInHours);
    if (isNaN(expiresInHours) || expiresInHours < 1 || expiresInHours > 168) {
      newErrors.expiresInHours = 'Expiration must be between 1 and 168 hours (7 days)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const baseAmountMinor = Math.round(parseFloat(formData.baseAmountMajor) * 100);
      
      await companyApi.createExtraCharge(bookingId, {
        reason: formData.reason,
        description: formData.description || null,
        evidenceUrls: formData.evidenceUrls,
        baseAmountMinor,
        expiresInHours: parseInt(formData.expiresInHours) || 48,
      });

      toast.success('Extra charge created successfully');
      setOpen(false);
      setFormData({
        reason: 'EXCESS_WEIGHT',
        description: '',
        evidenceUrls: [],
        baseAmountMajor: '',
        expiresInHours: '48',
      });
      setErrors({});
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create extra charge:', error);
      toast.error(getErrorMessage(error) || 'Failed to create extra charge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Additional Charge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Additional Charge</DialogTitle>
          <DialogDescription>
            Create a new additional charge request for this booking. The customer will be notified and can pay or decline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.reason}
              onValueChange={(value: any) =>
                setFormData({ ...formData, reason: value })
              }
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.reason}
              </p>
            )}
          </div>

          {/* Base Amount */}
          <div className="space-y-2">
            <Label htmlFor="baseAmountMajor">
              Base Amount (GBP) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="baseAmountMajor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.baseAmountMajor}
              onChange={(e) =>
                setFormData({ ...formData, baseAmountMajor: e.target.value })
              }
            />
            {errors.baseAmountMajor && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.baseAmountMajor}
              </p>
            )}
            <p className="text-xs text-gray-500">
              This is the base amount. Admin and processing fees will be calculated automatically.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide details about this additional charge..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Evidence URLs */}
          <div className="space-y-2">
            <Label htmlFor="evidenceUrls">Evidence URLs (Optional)</Label>
            <Textarea
              id="evidenceUrls"
              placeholder="Enter evidence URLs, one per line..."
              rows={3}
              value={formData.evidenceUrls.join('\n')}
              onChange={(e) => {
                const urls = e.target.value
                  .split('\n')
                  .map((url) => url.trim())
                  .filter((url) => url.length > 0);
                setFormData({ ...formData, evidenceUrls: urls });
              }}
            />
            <p className="text-xs text-gray-500">
              Enter one URL per line. These will be provided to the customer as evidence.
            </p>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiresInHours">
              Expiration (Hours) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expiresInHours"
              type="number"
              min="1"
              max="168"
              placeholder="48"
              value={formData.expiresInHours}
              onChange={(e) =>
                setFormData({ ...formData, expiresInHours: e.target.value })
              }
            />
            {errors.expiresInHours && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.expiresInHours}
              </p>
            )}
            <p className="text-xs text-gray-500">
              How many hours until this charge request expires? (Max 7 days / 168 hours)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Charge Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

