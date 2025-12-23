'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Warehouse,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { WarehouseAddress, CreateWarehouseAddressRequest, UpdateWarehouseAddressRequest } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { AddressAutocomplete } from '@/components/address-autocomplete';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseAddress | null>(null);
  
  // Form states
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseAddressRequest>({
    name: '',
    address: '',
    city: '',
    country: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyApi.getWarehouseAddresses();
      setWarehouses(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (warehouse: WarehouseAddress) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      country: warehouse.country,
      state: warehouse.state || '',
      postalCode: warehouse.postalCode || '',
      isDefault: warehouse.isDefault,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (warehouse: WarehouseAddress) => {
    setSelectedWarehouse(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Warehouse name is required');
        setSaving(false);
        return;
      }
      if (!formData.address.trim()) {
        setError('Address is required');
        setSaving(false);
        return;
      }
      if (!formData.city.trim()) {
        setError('City is required');
        setSaving(false);
        return;
      }
      if (!formData.country.trim()) {
        setError('Country is required');
        setSaving(false);
        return;
      }

      await companyApi.createWarehouseAddress(formData);
      setCreateDialogOpen(false);
      setSuccessMessage('Warehouse address created successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchWarehouses();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to create warehouse address');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: UpdateWarehouseAddressRequest = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        isDefault: formData.isDefault,
      };

      await companyApi.updateWarehouseAddress(selectedWarehouse.id, updateData);
      setEditDialogOpen(false);
      setSelectedWarehouse(null);
      setSuccessMessage('Warehouse address updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchWarehouses();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to update warehouse address');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWarehouse) return;

    setSaving(true);
    setError(null);

    try {
      await companyApi.deleteWarehouseAddress(selectedWarehouse.id);
      setDeleteDialogOpen(false);
      setSelectedWarehouse(null);
      setSuccessMessage('Warehouse address deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchWarehouses();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to delete warehouse address');
    } finally {
      setSaving(false);
    }
  };

  const defaultWarehouse = warehouses.find((w) => w.isDefault);
  const defaultCount = warehouses.filter((w) => w.isDefault).length;

  return (
    <GoogleMapsLoader>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Warehouse Addresses</h1>
            <p className="text-gray-600 mt-2">Manage your company&apos;s warehouse locations</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">All locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Default Warehouse</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{defaultCount}</div>
              <p className="text-xs text-muted-foreground">
                {defaultWarehouse ? defaultWarehouse.name : 'None set'}
              </p>
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Warehouse className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No warehouses found</p>
                <p className="text-sm mb-4">Get started by adding your first warehouse address</p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warehouse
                </Button>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-orange-600" />
                            {warehouse.name}
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(warehouse)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(warehouse)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Add a new warehouse address for your company. You can set one warehouse as default.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Warehouse Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Warehouse, London Distribution Center"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    country={formData.country}
                    placeholder="Enter street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <CitySelect
                      value={formData.city}
                      onChange={(value) => setFormData({ ...formData, city: value })}
                      country={formData.country}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <CountrySelect
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value, city: '' })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State or province"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="Postal/ZIP code"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault" className="font-normal cursor-pointer">
                    Set as default warehouse
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Warehouse'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Warehouse</DialogTitle>
              <DialogDescription>
                Update warehouse address details. Setting as default will unset any existing default warehouse.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Warehouse Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Warehouse, London Distribution Center"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    country={formData.country}
                    placeholder="Enter street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <CitySelect
                      value={formData.city}
                      onChange={(value) => setFormData({ ...formData, city: value })}
                      country={formData.country}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <CountrySelect
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value, city: '' })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State/Province</Label>
                    <Input
                      id="edit-state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State or province"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-postalCode">Postal Code</Label>
                    <Input
                      id="edit-postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="Postal/ZIP code"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-isDefault" className="font-normal cursor-pointer">
                    Set as default warehouse
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedWarehouse(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Warehouse'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Warehouse</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedWarehouse?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedWarehouse(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </GoogleMapsLoader>
  );
}

