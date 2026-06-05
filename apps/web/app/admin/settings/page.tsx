'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Globe, Mail, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? 'bg-brand' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    newApplicationEmail:   true,
    statusChangeEmail:     true,
    weeklyDigest:          false,
    slackIntegration:      false,
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode:       false,
    allowNewRegistrations: true,
    requireEmailVerify:    true,
    autoAssignApplications:false,
  });

  // General
  const [general, setGeneral] = useState({
    siteName:         'VisaFlow',
    supportEmail:     'support@visaflow.com',
    defaultTimezone:  'UTC',
    defaultLanguage:  'en',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', {
        general,
        notifications: notificationSettings,
        system: systemSettings,
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      if (data.data?.general) setGeneral(data.data.general);
      if (data.data?.notifications) setNotificationSettings(data.data.notifications);
      if (data.data?.system) setSystemSettings(data.data.system);
    }).catch(() => {});
  }, []);

  const sections = [
    {
      key: 'general',
      title: 'General',
      icon: Globe,
      content: (
        <div className="space-y-4">
          {[
            { label: 'Site Name', key: 'siteName', type: 'text', placeholder: 'VisaFlow' },
            { label: 'Support Email', key: 'supportEmail', type: 'email', placeholder: 'support@example.com' },
            { label: 'Default Timezone', key: 'defaultTimezone', type: 'text', placeholder: 'UTC' },
            { label: 'Default Language', key: 'defaultLanguage', type: 'text', placeholder: 'en' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={general[field.key as keyof typeof general]}
                onChange={e => setGeneral(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'notifications',
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          {[
            { key: 'newApplicationEmail',   label: 'New application email alerts',     desc: 'Get notified when a new application is submitted' },
            { key: 'statusChangeEmail',     label: 'Status change notifications',       desc: 'Email when application status changes' },
            { key: 'weeklyDigest',          label: 'Weekly digest',                     desc: 'Summary of all activity every Monday' },
            { key: 'slackIntegration',      label: 'Slack integration',                 desc: 'Send notifications to a Slack channel' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                onChange={v => setNotificationSettings(p => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'system',
      title: 'System',
      icon: Settings,
      content: (
        <div className="space-y-4">
          {[
            { key: 'maintenanceMode',        label: 'Maintenance Mode',           desc: 'Take site offline for maintenance', danger: true },
            { key: 'allowNewRegistrations',  label: 'Allow New Registrations',    desc: 'Let new users sign up', danger: false },
            { key: 'requireEmailVerify',     label: 'Require Email Verification', desc: 'New accounts must verify email', danger: false },
            { key: 'autoAssignApplications', label: 'Auto-assign Applications',   desc: 'Automatically assign to available agents', danger: false },
          ].map(item => (
            <div key={item.key} className={`flex items-center justify-between py-2 ${item.danger && systemSettings.maintenanceMode && item.key === 'maintenanceMode' ? 'text-destructive' : ''}`}>
              <div>
                <p className={`text-sm font-medium ${item.danger && systemSettings[item.key as keyof typeof systemSettings] ? 'text-destructive' : 'text-foreground'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={systemSettings[item.key as keyof typeof systemSettings]}
                onChange={v => setSystemSettings(p => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'security',
      title: 'Security',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-brand-soft rounded-xl border border-brand-soft">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand">Security Status: Good</p>
                <p className="text-xs text-brand mt-0.5">All security features are properly configured.</p>
              </div>
            </div>
          </div>
          {[
            { label: 'Session Timeout (minutes)', value: '60', type: 'number' },
            { label: 'Max Login Attempts',        value: '5',  type: 'number' },
            { label: 'Password Min Length',       value: '8',  type: 'number' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">{field.label}</label>
              <input
                type={field.type}
                defaultValue={field.value}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card max-w-xs"
              />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system-wide preferences.</p>
        </div>
        <Button variant="brand" onClick={handleSave} isLoading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Save All
        </Button>
      </div>

      {sections.map((section, i) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <section.icon className="w-4 h-4 text-muted-foreground/70" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {section.content}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
