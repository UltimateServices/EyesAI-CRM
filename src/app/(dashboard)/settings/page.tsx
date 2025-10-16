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
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export default function SettingsPage() {
  const router = useRouter();
  const currentOrganization = useStore((state) => state.currentOrganization);
  const organizationMembers = useStore((state) => state.organizationMembers);
  const currentUserRole = useStore((state) => state.currentUserRole);
  const fetchOrganizationMembers = useStore((state) => state.fetchOrganizationMembers);
  const removeMember = useStore((state) => state.removeMember);
  const updateMemberRole = useStore((state) => state.updateMemberRole);

  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Form fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'va'>('va');

  // Success state
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchOrganizationMembers();
      setLoading(false);
    };
    loadData();
  }, [fetchOrganizationMembers]);

  useEffect(() => {
    if (!loading && !['admin', 'manager'].includes(currentUserRole || '')) {
      alert('You do not have permission to access settings');
      router.push('/dashboard');
    }
  }, [currentUserRole, loading, router]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewUserPassword(password);
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (newUserPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setProcessing(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          name: newUserName,
        },
      });

      if (authError) throw authError;

      // Add to organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: currentOrganization?.id,
          user_id: authData.user.id,
          email: newUserEmail,
          role: newUserRole,
        }]);

      if (memberError) throw memberError;

      // Store created user info for display
      setCreatedUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('va');
      setShowCreateUser(false);

      await fetchOrganizationMembers();
    } catch (error: any) {
      console.error('Create user error:', error);
      alert('❌ Failed to create user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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

      {/* Success Message */}
      {createdUser && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5" />
            User Created Successfully!
          </h3>
          <div className="space-y-3 bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium text-slate-900">{createdUser.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(createdUser.name, 'name')}
              >
                {copiedField === 'name' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium text-slate-900">{createdUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(createdUser.email, 'email')}
              >
                {copiedField === 'email' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Password</p>
                <p className="font-mono font-medium text-slate-900">{createdUser.password}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(createdUser.password, 'password')}
              >
                {copiedField === 'password' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div>
              <p className="text-sm text-slate-600">Role</p>
              <Badge className={getRoleColor(createdUser.role)}>
                {createdUser.role.toUpperCase()}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-green-700 mt-4">
            📋 Copy these credentials and send them to the user. They can login immediately at{' '}
            <span className="font-mono bg-white px-2 py-1 rounded">
              https://eyes-ai-crm.vercel.app/login
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreatedUser(null)}
            className="mt-3"
          >
            Dismiss
          </Button>
        </Card>
      )}

      {/* Team Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
            <Badge variant="secondary">{organizationMembers.length}</Badge>
          </div>
          <Button onClick={() => setShowCreateUser(!showCreateUser)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Create User
          </Button>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-4">Create New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      disabled={processing}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    disabled={processing}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  disabled={processing}
                >
                  <option value="va">VA - Virtual Assistant</option>
                  <option value="manager">Manager - Team Lead</option>
                  <option value="admin">Admin - Full Access</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateUser} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserRole('va');
                }}
                disabled={processing}
              >
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
              <li>• Create and manage users</li>
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
              <li>• Create and manage users</li>
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