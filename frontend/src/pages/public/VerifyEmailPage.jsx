import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const VerifyEmailPage = () => {
  const { token } = useParams();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          await refreshUser();
        }
      } catch (err) {
        if (isMounted) {
          setSuccess(false);
          setErrorMessage(err.message || 'Invalid or expired verification link');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token) {
      verify();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center shadow-warm">
        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
            <h3 className="font-serif text-lg font-bold text-neutral-800">
              Verifying your email...
            </h3>
            <p className="text-xs text-neutral-500">
              Please wait while we confirm your email address.
            </p>
          </div>
        ) : success ? (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Email Verified!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto">
              Your email address has been successfully verified. You can now subscribe to home chefs and place daily meal reservations.
            </p>
            <div className="pt-4">
              <Link to="/discover">
                <Button variant="primary" size="md">
                  Go to Discovery
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Verification Failed
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto">
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="outline" size="md">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

