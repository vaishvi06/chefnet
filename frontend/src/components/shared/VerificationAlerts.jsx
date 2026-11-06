import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail, MapPin, ShieldAlert, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { Button } from '../ui/Button';

export const VerificationAlerts = () => {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);

  if (!user) return null;

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success('Verification link sent! Please check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* 1. Unverified Email Banner */}
      {!user.isEmailVerified && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Email Verification Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                We sent a link to <span className="font-semibold">{user.email}</span>. Please verify your email to create meal subscriptions and reservations.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            loading={resending}
            icon={Send}
            className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0 text-xs self-start sm:self-auto"
          >
            Resend Email
          </Button>
        </div>
      )}

      {/* 2. Unverified Location Banner */}
      {!user.isLocationVerified && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-saffron-50 border border-saffron-300 rounded-2xl text-saffron-900 shadow-xs">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold">GPS Location Not Verified</p>
              <p className="text-saffron-700 mt-0.5">
                ChiefNet operates strictly within a 1 km radius. Please set your self-pickup location to discover home cooks and collect daily meals.
              </p>
            </div>
          </div>
          <Link
            to={user.role === 'customer' ? '/customer/profile' : '/chef/profile'}
            className="shrink-0 self-start sm:self-auto"
          >
            <Button
              variant="outline"
              size="sm"
              icon={MapPin}
              className="bg-white border-saffron-300 text-saffron-800 hover:bg-saffron-100 text-xs"
            >
              Verify Location
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Chef Awaiting Admin Approval */}
      {user.role === 'chef' && user.chefProfile?.verificationStatus === 'pending' && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-300 rounded-2xl text-blue-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Kitchen Verification Pending Admin Review</p>
            <p className="text-blue-700 mt-0.5">
              Your kitchen details are submitted and undergoing safety & hygiene verification by our admin team. Meal publishing and subscription approvals will unlock once approved.
            </p>
          </div>
        </div>
      )}

      {/* 4. Chef Rejected */}
      {user.role === 'chef' && user.chefProfile?.verificationStatus === 'rejected' && (
        <div className="flex items-start gap-3 p-4 bg-terracotta-50 border border-terracotta-300 rounded-2xl text-terracotta-900 shadow-xs">
          <AlertCircle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Kitchen Application Requires Attention</p>
            <p className="text-terracotta-700 mt-0.5">
              Your kitchen application was not approved. Please reach out to support or resubmit your kitchen details with proper capacity and operating information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
