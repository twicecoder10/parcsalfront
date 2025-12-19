'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Mail, MapPin, CheckCircle2, XCircle, ArrowLeft, Package, ShoppingCart, PoundSterling, Loader2, Warehouse } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { CompanyDetail, AdminWarehouseAddress } from '@/lib/admin-api';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/lib/use-confirm';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [stats, setStats] = useState<{
    totalShipments: number;
    activeShipments: number;
    totalBookings: number;
    revenue: number;
    teamSize: number;
  } | null>(null);
  const [warehouses, setWarehouses] = useState<AdminWarehouseAddress[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        const [companyData, statsData] = await Promise.all([
          adminApi.getCompany(params.id),
          adminApi.getCompanyStats(params.id),
        ]);
        setCompany(companyData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };

    const fetchWarehouses = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        setWarehousesLoading(true);
        const warehousesData = await adminApi.getCompanyWarehouseAddresses(params.id);
        setWarehouses(warehousesData);
      } catch (err) {
        // Silently fail for warehouses - not all companies may have them
        console.error('Failed to load warehouses:', err);
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchCompany();
    fetchWarehouses();
  }, [params.id]);

  const handleVerify = async () => {
    if (!company) return;
    try {
      setActionLoading(true);
      await adminApi.verifyCompany(company.id);
      setCompany({ ...company, isVerified: true });
      toast.success('Company verified successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnverify = async () => {
    if (!company) return;
    try {
      setActionLoading(true);
      await adminApi.unverifyCompany(company.id);
      setCompany({ ...company, isVerified: false });
      toast.success('Company unverified successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unverify company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!company) return;
    const confirmed = await confirm({
      title: 'Deactivate Company',
      description: 'Are you sure you want to deactivate this company?',
      variant: 'destructive',
      confirmText: 'Deactivate',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await adminApi.deactivateCompany(company.id);
      toast.success('Company deactivated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate company');
    } finally {
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

  if (error || !company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-gray-600 mt-2">Company ID: {company.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {company.isVerified ? (
            <Button variant="outline" onClick={handleUnverify} disabled={actionLoading}>
              <XCircle className="mr-2 h-4 w-4" />
              Unverify
            </Button>
          ) : (
            <Button onClick={handleVerify} disabled={actionLoading}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Verify Company
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeactivate} disabled={actionLoading}>
            Deactivate Company
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalShipments || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeShipments || 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats?.revenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamSize || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Company Name</p>
              <p className="text-sm text-gray-600">{company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-gray-600">
                {company.city}, {company.country}
              </p>
            </div>
          </div>
          {company.description && (
            <div className="flex items-start gap-2">
              <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm text-gray-600">{company.description}</p>
              </div>
            </div>
          )}
          {company.admin && (
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Admin Email</p>
                <p className="text-sm text-gray-600">{company.admin.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {company.activePlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription</CardTitle>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{company.activePlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Price</span>
                <span className="font-medium">£{company.activePlan.priceMonthly}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-orange-600" />
              <CardTitle>Warehouse Addresses</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{warehouses.length} {warehouses.length === 1 ? 'warehouse' : 'warehouses'}</Badge>
              <Link href={`/admin/companies/${company.id}/warehouses`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {warehousesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Warehouse className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No warehouse addresses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {warehouse.name}
                          {warehouse.isDefault && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{warehouse.address}</p>
                          {warehouse.postalCode && (
                            <p className="text-xs text-gray-500">{warehouse.postalCode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{warehouse.city}</p>
                          {warehouse.state && (
                            <p className="text-xs text-gray-500">{warehouse.state}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{warehouse.country}</span>
                      </TableCell>
                      <TableCell>
                        {warehouse.isDefault ? (
                          <Badge className="bg-green-100 text-green-800">Default</Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(warehouse.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}

