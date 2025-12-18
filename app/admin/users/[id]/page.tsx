'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, Mail, Calendar, Building2, ArrowLeft, Package, ShoppingCart, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { AdminUserDetail } from '@/lib/admin-api';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/lib/use-confirm';

const roleColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  COMPANY_ADMIN: 'bg-purple-100 text-purple-800',
  COMPANY_STAFF: 'bg-purple-100 text-purple-800',
  SUPER_ADMIN: 'bg-red-100 text-red-800',
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        const userData = await adminApi.getUser(params.id);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  const handleActivate = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      await adminApi.activateUser(user.id);
      // Refresh user data
      const updatedUser = await adminApi.getUser(user.id);
      setUser(updatedUser);
      toast.success('User activated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: 'Deactivate User',
      description: 'Are you sure you want to deactivate this user?',
      variant: 'destructive',
      confirmText: 'Deactivate',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await adminApi.deactivateUser(user.id);
      // Refresh user data
      const updatedUser = await adminApi.getUser(user.id);
      setUser(updatedUser);
      toast.success('User deactivated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: 'Delete User',
      description: `Are you sure you want to permanently delete user "${user.fullName}"? This action cannot be undone.`,
      variant: 'destructive',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await adminApi.deleteUser(user.id);
      toast.success('User deleted successfully');
      // Redirect back to users list after successful deletion
      router.push('/admin/users');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Note: API doesn't return isActive or lastLogin, so we'll handle those differently
  const isActive = true; // This would need to come from API if available
  
  // Check if user is deleted (deleted users have email ending with @deleted.local and fullName "Deleted User")
  const isDeleted = user.email?.endsWith('@deleted.local') || user.fullName === 'Deleted User';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-gray-600 mt-2">User ID: {user.id}</p>
          </div>
        </div>
        {!isDeleted && (
          <div className="flex gap-2">
            {isActive ? (
              <Button variant="outline" onClick={handleDeactivate} disabled={actionLoading}>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button onClick={handleActivate} disabled={actionLoading}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={actionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {user.role === 'CUSTOMER' && user.stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">{user.stats.activeBookings} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{user.stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-500 mb-1">Full Name</p>
              <p className="text-base text-gray-900">{user.fullName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-500 mb-1">Email</p>
              <p className="text-base text-gray-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 flex items-center justify-center mt-0.5">
              <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-500 mb-1">Role</p>
              <Badge className={roleColors[user.role] || ''}>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-500 mb-1">Account Status</p>
              {isDeleted ? (
                <Badge className="bg-gray-100 text-gray-800">
                  Deleted
                </Badge>
              ) : (
                <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
          </div>
          {user.company && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-500 mb-1">Company</p>
                <Link href={`/admin/companies/${user.company.id}`}>
                  <Button variant="link" className="p-0 h-auto text-base text-gray-900 hover:text-blue-600">
                    {user.company.name}
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-500 mb-1">Created At</p>
              <p className="text-base text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings (for customers) */}
      {user.role === 'CUSTOMER' && user.recentBookings && user.recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.shipmentSlot.originCity} → {booking.shipmentSlot.destinationCity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog />
    </div>
  );
}

