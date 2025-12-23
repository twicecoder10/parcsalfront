'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Edit, Settings, CheckCircle2, AlertCircle, X, Mail, Clock, UserCheck, Truck } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { TeamMember, StaffRestrictions, TeamInvitation, InvitationStatus } from '@/lib/company-api';
import { getStoredUser } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfirm } from '@/lib/use-confirm';
import { toast } from '@/lib/toast';

export default function TeamPage() {
  const user = getStoredUser();
  const { confirm, ConfirmDialog } = useConfirm();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'COMPANY_STAFF' | 'COMPANY_ADMIN'>('COMPANY_STAFF');
  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [restrictionsDialogOpen, setRestrictionsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [restrictions, setRestrictions] = useState<Record<string, boolean>>({});
  const [loadingRestrictions, setLoadingRestrictions] = useState(false);
  const [savingRestrictions, setSavingRestrictions] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'driver' | 'staff' | 'customized' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Invitations state
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [revokingInvitation, setRevokingInvitation] = useState<string | null>(null);
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<InvitationStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchTeamMembers();
    fetchInvitations();
  }, []);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const members = await companyApi.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (status?: InvitationStatus) => {
    setLoadingInvitations(true);
    try {
      const data = await companyApi.getInvitations(status);
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage(null);
    try {
      await companyApi.inviteTeamMember({ email, role });
      setOpen(false);
      setEmail('');
      setRole('COMPANY_STAFF');
      // Refresh both lists
      await fetchTeamMembers();
      await fetchInvitations(invitationStatusFilter !== 'ALL' ? invitationStatusFilter : undefined);
      setMessage({ type: 'success', text: 'Invitation sent successfully!' });
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    const confirmed = await confirm({
      title: 'Revoke Invitation',
      description: 'Are you sure you want to revoke this invitation?',
      variant: 'destructive',
      confirmText: 'Revoke',
    });
    if (!confirmed) return;
    
    setRevokingInvitation(invitationId);
    setMessage(null);
    try {
      await companyApi.revokeInvitation(invitationId);
      await fetchInvitations(invitationStatusFilter !== 'ALL' ? invitationStatusFilter : undefined);
      setMessage({ type: 'success', text: 'Invitation revoked successfully' });
    } catch (error: any) {
      console.error('Failed to revoke invitation:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setRevokingInvitation(null);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    const filterStatus = status === 'ALL' ? 'ALL' : (status as InvitationStatus);
    setInvitationStatusFilter(filterStatus);
    fetchInvitations(filterStatus !== 'ALL' ? filterStatus : undefined);
  };

  const handleRemoveMember = async (memberId: string) => {
    const confirmed = await confirm({
      title: 'Remove Team Member',
      description: 'Are you sure you want to remove this team member?',
      variant: 'destructive',
      confirmText: 'Remove',
    });
    if (!confirmed) return;
    
    setDeletingMember(memberId);
    setMessage(null);
    try {
      await companyApi.removeTeamMember(memberId);
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
      setMessage({ type: 'success', text: 'Team member removed successfully' });
    } catch (error: any) {
      console.error('Failed to remove team member:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeletingMember(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'COMPANY_STAFF' | 'COMPANY_ADMIN') => {
    setUpdatingRole(memberId);
    setMessage(null);
    try {
      const updatedMember = await companyApi.updateTeamMemberRole(memberId, newRole);
      setTeamMembers(teamMembers.map(m => m.id === memberId ? updatedMember : m));
      setMessage({ type: 'success', text: 'Role updated successfully' });
    } catch (error: any) {
      console.error('Failed to update role:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUpdatingRole(null);
    }
  };

  // Preset restriction configurations
  const restrictionPresets = {
    driver: {
      createShipment: false,
      updateShipment: false,
      deleteShipment: false,
      updateShipmentStatus: false,
      updateShipmentTrackingStatus: true,
      acceptBooking: false,
      rejectBooking: false,
      updateBookingStatus: true,
      addProofImages: true,
      regenerateLabel: false,
      replyToReview: false,
      viewAnalytics: false,
      viewBookings: true,
      viewShipments: true,
      viewPayments: false,
      viewPaymentStats: false,
      processRefund: false,
      replyToMessage: true,
      viewMessages: true,
    },
    staff: {
      createShipment: true,
      updateShipment: true,
      deleteShipment: false,
      updateShipmentStatus: true,
      updateShipmentTrackingStatus: true,
      acceptBooking: true,
      rejectBooking: true,
      updateBookingStatus: true,
      addProofImages: true,
      regenerateLabel: true,
      replyToReview: true,
      viewAnalytics: true,
      viewBookings: true,
      viewShipments: true,
      viewPayments: true,
      viewPaymentStats: true,
      processRefund: false,
      replyToMessage: true,
      viewMessages: true,
    },
    customized: {
      createShipment: true,
      updateShipment: true,
      deleteShipment: true,
      updateShipmentStatus: true,
      updateShipmentTrackingStatus: true,
      acceptBooking: true,
      rejectBooking: true,
      updateBookingStatus: true,
      addProofImages: true,
      regenerateLabel: true,
      replyToReview: true,
      viewAnalytics: true,
      viewBookings: true,
      viewShipments: true,
      viewPayments: true,
      viewPaymentStats: true,
      processRefund: true,
      replyToMessage: true,
      viewMessages: true,
    },
  };

  const applyPreset = (preset: 'driver' | 'staff' | 'customized') => {
    setSelectedPreset(preset);
    setRestrictions(restrictionPresets[preset]);
  };

  const handleOpenRestrictions = async (member: TeamMember) => {
    if (member.role === 'COMPANY_ADMIN') {
      toast.warning('Admins cannot have restrictions applied.');
      return;
    }
    
    setSelectedMember(member);
    setRestrictionsDialogOpen(true);
    setLoadingRestrictions(true);
    setSelectedPreset(null); // Reset preset selection
    
    try {
      const data = await companyApi.getStaffRestrictions(member.id);
      const currentRestrictions = data.restrictions || {};
      setRestrictions(currentRestrictions);
      
      // Check if current restrictions match a preset
      const matchesDriver = Object.keys(restrictionPresets.driver).every(
        key => (currentRestrictions[key] ?? true) === restrictionPresets.driver[key as keyof typeof restrictionPresets.driver]
      );
      const matchesStaff = Object.keys(restrictionPresets.staff).every(
        key => (currentRestrictions[key] ?? true) === restrictionPresets.staff[key as keyof typeof restrictionPresets.staff]
      );
      const matchesCustomized = Object.keys(restrictionPresets.customized).every(
        key => (currentRestrictions[key] ?? true) === restrictionPresets.customized[key as keyof typeof restrictionPresets.customized]
      );
      
      if (matchesDriver) {
        setSelectedPreset('driver');
      } else if (matchesStaff) {
        setSelectedPreset('staff');
      } else if (matchesCustomized) {
        setSelectedPreset('customized');
      }
    } catch (error: any) {
      console.error('Failed to load restrictions:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
      setRestrictionsDialogOpen(false);
    } finally {
      setLoadingRestrictions(false);
    }
  };

  const handleSaveRestrictions = async () => {
    if (!selectedMember) return;
    
    setSavingRestrictions(true);
    setMessage(null);
    try {
      await companyApi.updateStaffRestrictions(selectedMember.id, restrictions);
      setRestrictionsDialogOpen(false);
      setSelectedMember(null);
      setMessage({ type: 'success', text: 'Restrictions updated successfully!' });
    } catch (error: any) {
      console.error('Failed to update restrictions:', error);
      const errorMessage = getErrorMessage(error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSavingRestrictions(false);
    }
  };

  const toggleRestriction = (action: string) => {
    setRestrictions((prev) => {
      const updated = {
        ...prev,
        [action]: !(prev[action] ?? true),
      };
      
      // Check if updated restrictions match a preset
      const matchesDriver = Object.keys(restrictionPresets.driver).every(
        k => (updated[k] ?? true) === restrictionPresets.driver[k as keyof typeof restrictionPresets.driver]
      );
      const matchesStaff = Object.keys(restrictionPresets.staff).every(
        k => (updated[k] ?? true) === restrictionPresets.staff[k as keyof typeof restrictionPresets.staff]
      );
      const matchesCustomized = Object.keys(restrictionPresets.customized).every(
        k => (updated[k] ?? true) === restrictionPresets.customized[k as keyof typeof restrictionPresets.customized]
      );
      
      if (matchesDriver) {
        setSelectedPreset('driver');
      } else if (matchesStaff) {
        setSelectedPreset('staff');
      } else if (matchesCustomized) {
        setSelectedPreset('customized');
      } else {
        setSelectedPreset(null); // No preset matches
      }
      
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <Card className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setMessage(null)}
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-gray-600 mt-2">Manage your team members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member to join your company.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as 'COMPANY_STAFF' | 'COMPANY_ADMIN')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY_STAFF">Staff</SelectItem>
                      <SelectItem value="COMPANY_ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={inviting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {invitations.filter(inv => inv.status === 'PENDING').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {invitations.filter(inv => inv.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Current members of your team</CardDescription>
            </CardHeader>
            <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => {
                    const isCurrentUser = user?.id === member.id;
                    const canEdit = !isCurrentUser;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name}
                          {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(You)</span>}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {updatingRole === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => handleUpdateRole(member.id, newRole as 'COMPANY_STAFF' | 'COMPANY_ADMIN')}
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="COMPANY_STAFF">Staff</SelectItem>
                                <SelectItem value="COMPANY_ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {member.role === 'COMPANY_STAFF' && canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRestrictions(member)}
                                title="Manage Restrictions"
                              >
                                <Settings className="h-4 w-4 text-gray-600" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={deletingMember === member.id}
                                title="Remove Member"
                              >
                                {deletingMember === member.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Invitations</CardTitle>
                  <CardDescription>Manage invitations sent to team members</CardDescription>
                </div>
                <Select value={invitationStatusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Invited At</TableHead>
                      <TableHead>Expires At</TableHead>
                      <TableHead>Accepted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No invitations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invitation.role === 'COMPANY_ADMIN' ? 'Admin' : 'Staff'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invitation.status === 'PENDING'
                                  ? 'default'
                                  : invitation.status === 'ACCEPTED'
                                  ? 'default'
                                  : invitation.status === 'EXPIRED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={
                                invitation.status === 'ACCEPTED' ? 'bg-green-500' : ''
                              }
                            >
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invitation.invitedBy ? (
                              <div className="text-sm">
                                <div className="font-medium">{invitation.invitedBy.name}</div>
                                <div className="text-gray-500 text-xs">{invitation.invitedBy.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(invitation.invitedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                              {invitation.status === 'PENDING' &&
                                new Date(invitation.expiresAt) < new Date() && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Expired
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {invitation.acceptedBy ? (
                              <div className="text-sm">
                                <div className="font-medium">{invitation.acceptedBy.name}</div>
                                <div className="text-gray-500 text-xs">{invitation.acceptedBy.email}</div>
                                {invitation.acceptedAt && (
                                  <div className="text-gray-400 text-xs mt-1">
                                    {new Date(invitation.acceptedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {invitation.status !== 'ACCEPTED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                disabled={revokingInvitation === invitation.id}
                                title="Revoke Invitation"
                              >
                                {revokingInvitation === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restrictions Dialog */}
      <Dialog open={restrictionsDialogOpen} onOpenChange={setRestrictionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Restrictions for {selectedMember?.name}</DialogTitle>
            <DialogDescription>
              Control what actions this staff member can perform. Toggle off any action to restrict it. Admins are never restricted.
            </DialogDescription>
          </DialogHeader>
          
          {loadingRestrictions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Preset Buttons */}
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Quick Presets:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedPreset === 'driver' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset('driver')}
                    className={selectedPreset === 'driver' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Driver
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPreset === 'staff' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset('staff')}
                    className={selectedPreset === 'staff' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Staff
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPreset === 'customized' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset('customized')}
                    className={selectedPreset === 'customized' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customized
                  </Button>
                </div>
                {selectedPreset && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPreset === 'driver' && 'Driver preset: Limited to tracking and delivery tasks'}
                    {selectedPreset === 'staff' && 'Staff preset: Full access with some restrictions'}
                    {selectedPreset === 'customized' && 'Customized preset: All permissions enabled, customize as needed'}
                  </p>
                )}
              </div>
              {/* Shipment Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Shipment Management</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="Create Shipments"
                    description="Allow staff to create new shipment slots"
                    enabled={restrictions.createShipment ?? true}
                    onChange={() => toggleRestriction('createShipment')}
                  />
                  <RestrictionToggle
                    label="Update Shipments"
                    description="Allow staff to edit existing shipments"
                    enabled={restrictions.updateShipment ?? true}
                    onChange={() => toggleRestriction('updateShipment')}
                  />
                  <RestrictionToggle
                    label="Delete Shipments"
                    description="Allow staff to delete shipments"
                    enabled={restrictions.deleteShipment ?? true}
                    onChange={() => toggleRestriction('deleteShipment')}
                  />
                  <RestrictionToggle
                    label="Update Shipment Status"
                    description="Allow staff to change shipment status (Draft, Published, Closed)"
                    enabled={restrictions.updateShipmentStatus ?? true}
                    onChange={() => toggleRestriction('updateShipmentStatus')}
                  />
                  <RestrictionToggle
                    label="Update Tracking Status"
                    description="Allow staff to update shipment tracking status"
                    enabled={restrictions.updateShipmentTrackingStatus ?? true}
                    onChange={() => toggleRestriction('updateShipmentTrackingStatus')}
                  />
                </div>
              </div>

              {/* Booking Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Booking Management</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="Accept Bookings"
                    description="Allow staff to accept booking requests"
                    enabled={restrictions.acceptBooking ?? true}
                    onChange={() => toggleRestriction('acceptBooking')}
                  />
                  <RestrictionToggle
                    label="Reject Bookings"
                    description="Allow staff to reject booking requests"
                    enabled={restrictions.rejectBooking ?? true}
                    onChange={() => toggleRestriction('rejectBooking')}
                  />
                  <RestrictionToggle
                    label="Update Booking Status"
                    description="Allow staff to update booking status (In Transit, Delivered, etc.)"
                    enabled={restrictions.updateBookingStatus ?? true}
                    onChange={() => toggleRestriction('updateBookingStatus')}
                  />
                  <RestrictionToggle
                    label="Add Proof Images"
                    description="Allow staff to add proof of pickup/delivery images"
                    enabled={restrictions.addProofImages ?? true}
                    onChange={() => toggleRestriction('addProofImages')}
                  />
                  <RestrictionToggle
                    label="Regenerate Labels"
                    description="Allow staff to regenerate shipping labels"
                    enabled={restrictions.regenerateLabel ?? true}
                    onChange={() => toggleRestriction('regenerateLabel')}
                  />
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="Reply to Reviews"
                    description="Allow staff to reply to customer reviews"
                    enabled={restrictions.replyToReview ?? true}
                    onChange={() => toggleRestriction('replyToReview')}
                  />
                </div>
              </div>

              {/* Messaging Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Messaging</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="View Messages"
                    description="Allow staff to view chat messages from customers"
                    enabled={restrictions.viewMessages ?? true}
                    onChange={() => toggleRestriction('viewMessages')}
                  />
                  <RestrictionToggle
                    label="Reply to Messages"
                    description="Allow staff to reply to customer messages"
                    enabled={restrictions.replyToMessage ?? true}
                    onChange={() => toggleRestriction('replyToMessage')}
                  />
                </div>
              </div>

              {/* Viewing Permissions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Viewing Permissions</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="View Analytics"
                    description="Allow staff to view analytics and statistics"
                    enabled={restrictions.viewAnalytics ?? true}
                    onChange={() => toggleRestriction('viewAnalytics')}
                  />
                  <RestrictionToggle
                    label="View Bookings"
                    description="Allow staff to view company bookings"
                    enabled={restrictions.viewBookings ?? true}
                    onChange={() => toggleRestriction('viewBookings')}
                  />
                  <RestrictionToggle
                    label="View Shipments"
                    description="Allow staff to view company shipments"
                    enabled={restrictions.viewShipments ?? true}
                    onChange={() => toggleRestriction('viewShipments')}
                  />
                  <RestrictionToggle
                    label="View Payments"
                    description="Allow staff to view payment transactions"
                    enabled={restrictions.viewPayments ?? true}
                    onChange={() => toggleRestriction('viewPayments')}
                  />
                  <RestrictionToggle
                    label="View Payment Stats"
                    description="Allow staff to view payment statistics and revenue"
                    enabled={restrictions.viewPaymentStats ?? true}
                    onChange={() => toggleRestriction('viewPaymentStats')}
                  />
                </div>
              </div>

              {/* Payment Management */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <RestrictionToggle
                    label="Process Refunds"
                    description="Allow staff to process payment refunds"
                    enabled={restrictions.processRefund ?? true}
                    onChange={() => toggleRestriction('processRefund')}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestrictionsDialogOpen(false)}
              disabled={savingRestrictions}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveRestrictions}
              disabled={savingRestrictions || loadingRestrictions}
            >
              {savingRestrictions ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Restrictions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

// Restriction Toggle Component
function RestrictionToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={label} className="text-base font-medium cursor-pointer">
            {label}
          </Label>
          {!enabled && (
            <Badge variant="destructive" className="text-xs">
              Restricted
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="ml-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={onChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
        </label>
      </div>
    </div>
  );
}

