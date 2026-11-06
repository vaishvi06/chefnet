import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. admin@chiefnet.com)'),
  password: z.string().min(1, 'Password is required')
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setServerError(null);

    // Sanitize and guarantee strictly { email, password } payload format
    const payload = {
      email: (data.email || '').trim().toLowerCase(),
      password: data.password
    };

    // Diagnostic logging before calling auth service / API
    console.log('[LoginPage.onSubmit] Outgoing login payload:', {
      email: payload.email,
      password: payload.password ? '[PROTECTED]' : undefined
    });

    try {
      const user = await login(payload);
      toast.success(`Welcome back, ${user.name}!`);

      // Determine redirect path by role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/overview', { replace: true });
      } else if (user.role === 'chef') {
        navigate('/chef/dashboard', { replace: true });
      } else {
        navigate('/customer/discover', { replace: true });
      }
    } catch (err) {
      console.error('[LoginPage.onSubmit] Login error caught:', err);
      setServerError(err.message || 'Invalid email or password');
    }
  };

  const fillCredentials = (email, password) => {
    setValue('email', email, { shouldValidate: true, shouldDirty: true });
    setValue('password', password, { shouldValidate: true, shouldDirty: true });
    setServerError(null);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 shadow-warm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900">
            Sign In to ChiefNet
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Access your home-food subscriptions & reservations
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="e.g. admin@chiefnet.com"
            helperText="Note: ChiefNet authenticates using full email address, not username."
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Password <span className="text-terracotta-600">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-700 hover:text-primary-800 font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-6 pt-4 border-t border-cream-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            <span>Quick Login with Seed Credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@chiefnet.com', 'Admin123#Secure')}
              className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-cream-100 hover:bg-cream-200 text-primary-900 border border-cream-300 transition-colors flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-primary-700" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('shanti.devi@chiefnet.test', 'Password123#Secure')}
              className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-cream-100 hover:bg-cream-200 text-neutral-800 border border-cream-300 transition-colors"
            >
              Chef Shanti
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('rohan.customer@chiefnet.test', 'Password123#Secure')}
              className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-cream-100 hover:bg-cream-200 text-neutral-800 border border-cream-300 transition-colors"
            >
              Customer
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-neutral-500 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-primary-700 hover:underline">
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
};
