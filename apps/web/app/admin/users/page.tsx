'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Users, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { UserEntity } from '@visaflow/shared-types';
import dayjs from 'dayjs';

type RoleConfig = { label: string; variant: string };

const defaultRoleConfig: RoleConfig = {
  label: 'Applicant',
  variant: 'secondary',
};

const roleConfig: Record<string, RoleConfig> = {
  APPLICANT:   defaultRoleConfig,
  AGENT:       { label: 'Agent',       variant: 'info'      },
  ADMIN:       { label: 'Admin',       variant: 'warning'   },
  SUPER_ADMIN: { label: 'Super Admin', variant: 'destructive'},
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users?limit=50').then(({ data }) => {
      setUsers(getResponseItems<UserEntity>(data.data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Last Login'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No users found
                    </td>
                  </tr>
                ) : filtered.map((user, i) => {
                  const roleCfg = roleConfig[user.role] ?? defaultRoleConfig;
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            {!user.isActive && <p className="text-xs text-red-500">Inactive</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-700">{user.email}</span>
                          {user.emailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleCfg.variant as never} className="text-xs">{roleCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {dayjs(user.createdAt).format('DD MMM YYYY')}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {user.lastLoginAt ? dayjs(user.lastLoginAt).format('DD MMM YYYY') : '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
