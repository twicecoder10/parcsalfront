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
import { Warehouse, ArrowLeft, MapPin, Building2, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { AdminWarehouseAddress, CompanyDetail } from '@/lib/admin-api';

export default function CompanyWarehousesPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [warehouses, setWarehouses] = useState<AdminWarehouseAddress[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        const [companyData, warehousesData] = await Promise.all([
          adminApi.getCompany(params.id),
          adminApi.getCompanyWarehouseAddresses(params.id),
        ]);
        setCompany(companyData);
        setWarehouses(warehousesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const defaultCount = warehouses.filter((w) => w.isDefault).length;

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
            <h1 className="text-3xl font-bold">Warehouse Addresses</h1>
            <p className="text-gray-600 mt-2">
              {company.name} - {warehouses.length} {warehouses.length === 1 ? 'warehouse' : 'warehouses'}
            </p>
          </div>
        </div>
        <Link href={`/admin/companies/${company.id}`}>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            View Company
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">All warehouses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Warehouses</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultCount}</div>
            <p className="text-xs text-muted-foreground">Primary locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standard Warehouses</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length - defaultCount}</div>
            <p className="text-xs text-muted-foreground">Secondary locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Warehouse className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No warehouses found</p>
              <p className="text-sm">This company has no warehouse addresses yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-orange-600" />
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
                          <p className="text-xs text-gray-500">{warehouse.country}</p>
                        </div>
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
    </div>
  );
}

