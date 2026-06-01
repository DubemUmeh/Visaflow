'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, Calendar, Shield, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import api from '@/lib/api';

const profileSchema = z.object({
  firstName:      z.string().min(2, 'First name required'),
  lastName:       z.string().min(2, 'Last name required'),
  phone:          z.string().optional(),
  dateOfBirth:    z.string().optional(),
  nationality:    z.string().optional(),
  passportNumber: z.string().optional(),
  timezone:       z.string().optional(),
  preferredLocale:z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'notifications'>('personal');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName:       user?.firstName      ?? '',
      lastName:        user?.lastName       ?? '',
      phone:           user?.phone          ?? '',
      dateOfBirth:     user?.dateOfBirth    ?? '',
      nationality:     user?.nationality    ?? '',
      passportNumber:  user?.passportNumber ?? '',
      timezone:        user?.timezone       ?? 'UTC',
      preferredLocale: user?.preferredLocale ?? 'en',
    },
  });

  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      await api.patch('/users/me', data);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'VF';

  const tabs = [
    { key: 'personal', label: 'Personal Info', icon: User },
    { key: 'security', label: 'Security',      icon: Shield },
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and account settings.</p>
      </div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user?.emailVerified ? 'success' : 'warning'} className="gap-1 text-xs">
                    {user?.emailVerified ? <CheckCircle2 className="w-3 h-3" /> : null}
                    {user?.emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant="info" className="text-xs capitalize">
                    {user?.role?.toLowerCase().replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    leftIcon={<User />}
                    error={profileForm.formState.errors.firstName?.message}
                    {...profileForm.register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    error={profileForm.formState.errors.lastName?.message}
                    {...profileForm.register('lastName')}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  leftIcon={<Mail />}
                  value={user?.email}
                  disabled
                  hint="Email cannot be changed directly. Contact support."
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  leftIcon={<Phone />}
                  placeholder="+1 555 000 0000"
                  error={profileForm.formState.errors.phone?.message}
                  {...profileForm.register('phone')}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    leftIcon={<Calendar />}
                    error={profileForm.formState.errors.dateOfBirth?.message}
                    {...profileForm.register('dateOfBirth')}
                  />
                  <Input
                    label="Nationality"
                    placeholder="e.g. American"
                    leftIcon={<Globe />}
                    error={profileForm.formState.errors.nationality?.message}
                    {...profileForm.register('nationality')}
                  />
                </div>

                <div className="border-t pt-5">
                  <h3 className="font-medium text-gray-900 mb-4 text-sm">Passport Information</h3>
                  <Input
                    label="Passport Number"
                    placeholder="AB1234567"
                    hint="Keep this updated to speed up applications"
                    error={profileForm.formState.errors.passportNumber?.message}
                    {...profileForm.register('passportNumber')}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="brand" isLoading={savingProfile}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  leftIcon={<Shield />}
                  error={passwordForm.formState.errors.currentPassword?.message}
                  {...passwordForm.register('currentPassword')}
                />
                <Input
                  label="New Password"
                  type="password"
                  hint="At least 8 characters with uppercase and number"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="brand" isLoading={savingPassword}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Button variant={user?.twoFactorEnabled ? 'outline' : 'brand'} size="sm">
                  {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Delete Account</p>
                  <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
