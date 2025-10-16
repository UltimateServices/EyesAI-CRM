'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Crown,
  Briefcase,
  User,
  Loader2,
  Building2,
  Mail
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const currentOrganization = useStore((state) => state.currentOrganization);
  const organizationMembers = useStore((state) => state.organizationMembers);
  const currentUserRole = useStore((state) => state.currentUserRole);
  const fetchOrganizationMembers = useStore((state) => state.fetchOrganizationMembers);
  const addOrganizationMember = useStore((state) => state.addOrganizationMember);
  const updateMemberRole = useStore((state) => state.updateMemberRole);
  const removeMember = useStore((state) => state.removeMember);

  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'manager' | 'va'>('va');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchOrganizationMembers();
      setLoading(false);
    };
    loadData();
  }, [fetchOrganizationMembers]);

  // Redirect if not admin or manager
  useEffect(() => {
    if (!loading && !['admin', 'manager'].includes(currentUserRole || '')) {
      alert('You do not have permission to access settings');
      router.push('/dashboard');
    }
  }, [currentUserRole, loading, router]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setProcessing(true);
    try {
      await addOrganizationMember(newMemberEmail, newMemberRole);
      setNewMemberEmail('');
      setNewMemberRole('va');
      setShowAddMember(false);
      alert('✅ Member added successfully!');
    } catch (error: any) {
      alert('❌ Failed to add member: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'manager' | 'va') => {
    if (!confirm('Are you sure you want to change this member\'s role?')) return;

    setProcessing(true);
    try {
      await updateMemberRole(memberId, newRole);
      alert('✅ Role updated successfully!');
    } catch (error: any) {
      alert('❌ Failed to update role: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setProcessing(true);
    try {
      await removeMember(memberId);
      alert('✅ Member removed successfully!');
    } catch (error: any) {
      alert('❌ Failed to remove member: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'manager': return <Briefcase className="w-4 h-4" />;
      case 'va': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'va': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your organization and team members</p>
        </div>
      </div>

      {/* Organization Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Organization</h2>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-slate-700">Name:</span>
            <p className="text-slate-900">{currentOrganization?.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-700">Your Role:</span>
            <Badge className={`${getRoleColor(currentUserRole || '')} ml-2`}>
              {currentUserRole?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
            <Badge variant="secondary">{organizationMembers.length}</Badge>
          </div>
          <Button onClick={() => setShowAddMember(!showAddMember)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-3">Add New Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  disabled={processing}
                >
                  <option value="va">VA</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddMember} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddMember(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {organizationMembers.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {member.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      {member.email || 'No email'}
                      {member.userId === currentOrganization?.ownerId && (
                        <Badge className="bg-yellow-100 text-yellow-700">Owner</Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(member.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role.toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Change Dropdown */}
                  {member.userId !== currentOrganization?.ownerId && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as any)}
                        className="px-3 py-1 border border-slate-300 rounded text-sm"
                        disabled={processing}
                      >
                        <option value="va">VA</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={processing}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Permissions Reference */}
      <Card className="p-6 bg-slate-50">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Role Permissions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <h4 className="font-semibold text-slate-900">Admin</h4>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 ml-6">
              <li>• Full access to everything</li>
              <li>• Manage team members</li>
              <li>• Create/edit/delete companies</li>
              <li>• Access all settings</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Manager</h4>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 ml-6">
              <li>• Add/remove team members</li>
              <li>• Create/edit/delete companies</li>
              <li>• Access settings</li>
              <li>• Manage all data</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-slate-900">VA</h4>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 ml-6">
              <li>• Create/edit companies</li>
              <li>• Manage intakes & reviews</li>
              <li>• Upload media</li>
              <li>• Cannot delete or manage team</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}