import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordErrorMsg =
  'Password must be at least 8 characters long and contain at least one letter and one number';

const resetSchema = z
  .object({
    password: z.string().regex(passwordPattern, passwordErrorMsg),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
      toast.success('Password updated successfully! Please log in.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(err.message || 'Invalid or expired password reset token');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 shadow-warm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900">
            Set New Password
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Choose a strong password to protect your account
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-left">
                Your password has been reset successfully. Redirecting you to the sign in page...
              </p>
            </div>
            <Link to="/login" className="inline-block mt-4">
              <Button variant="primary" size="md">
                Sign In Now
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="Min. 8 chars with letter and number"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={Lock}
              placeholder="Repeat password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              Update Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

