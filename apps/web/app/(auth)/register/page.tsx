'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  agreeToTerms: z.boolean().refine((v) => v, 'You must agree to the terms'),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;
    if (score <= 2) return { level: score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: score, label: 'Fair', color: 'bg-yellow-500' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast.success('Account created! Welcome to VisaFlow.');
      if (from && to) {
        router.push(`/dashboard/applications/new?from=${from}&to=${to}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      // error handled in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            {from && to ? `Start your visa application from ${from} to ${to}` : 'Start applying for visas in minutes'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              type="text"
              placeholder="Jane"
              leftIcon={<User />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              type="text"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              leftIcon={<Lock />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength.level <= 2 ? 'text-red-500' : strength.level <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {strength.label} password
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded" {...register('agreeToTerms')} />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="mt-1 text-xs text-destructive">{errors.agreeToTerms.message}</p>
            )}
          </div>

          <Button type="submit" variant="brand" className="w-full" size="lg" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
