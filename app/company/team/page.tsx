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
import { Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { TeamMember } from '@/lib/company-api';
import { getStoredUser } from '@/lib/auth';

export default function TeamPage() {
  const user = getStoredUser();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'COMPANY_STAFF' | 'COMPANY_ADMIN'>('COMPANY_STAFF');
  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await companyApi.inviteTeamMember({ email, role });
      setOpen(false);
      setEmail('');
      setRole('COMPANY_STAFF');
      // Optionally refresh the list (invitation might not appear immediately)
      await fetchTeamMembers();
      alert('Invitation sent successfully!');
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      alert(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    setDeletingMember(memberId);
    try {
      await companyApi.removeTeamMember(memberId);
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (error: any) {
      console.error('Failed to remove team member:', error);
      alert(error.message || 'Failed to remove team member. Please try again.');
    } finally {
      setDeletingMember(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'COMPANY_STAFF' | 'COMPANY_ADMIN') => {
    setUpdatingRole(memberId);
    try {
      const updatedMember = await companyApi.updateTeamMemberRole(memberId, newRole);
      setTeamMembers(teamMembers.map(m => m.id === memberId ? updatedMember : m));
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.message || 'Failed to update role. Please try again.');
    } finally {
      setUpdatingRole(null);
    }
  };

  return (
    <div className="space-y-6">
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
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={deletingMember === member.id}
                            >
                              {deletingMember === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          )}
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
    </div>
  );
}

