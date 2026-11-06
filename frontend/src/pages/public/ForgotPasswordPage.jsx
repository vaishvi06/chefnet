import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 shadow-warm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900">
            Forgot Password
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Enter your registered email and we will send you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-left">
                If an account with that email exists, a password reset link has been dispatched to your inbox.
              </p>
            </div>
            <Link to="/login" className="inline-block mt-4">
              <Button variant="outline" size="md">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-xs text-terracotta-600 font-medium">{serverError}</p>
            )}

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@domain.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              Send Password Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

