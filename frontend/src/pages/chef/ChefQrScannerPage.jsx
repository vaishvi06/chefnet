import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScanLine, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationApi } from '../../api/reservationApi';
import { QrScanner } from '../../components/shared/QrScanner';

export const ChefQrScannerPage = () => {
  const queryClient = useQueryClient();
  const [verifyResult, setVerifyResult] = useState(null);

  const verifyMutation = useMutation({
    mutationFn: (qrToken) => reservationApi.verifyQR(qrToken),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chefQueue'] });
      queryClient.invalidateQueries({ queryKey: ['chefTodayReservations'] });
      queryClient.invalidateQueries({ queryKey: ['chefDashboardAnalytics'] });
      setVerifyResult({
        success: true,
        message: res.message || 'QR verified successfully! Meal marked as picked up.',
        reservation: res.data?.reservation
      });
      toast.success('Pickup verified!');
    },
    onError: (err) => {
      setVerifyResult({
        success: false,
        message: err.message || 'Failed to verify QR token'
      });
      toast.error(err.message || 'Verification error');
    }
  });

  const handleVerify = (token) => {
    setVerifyResult(null);
    verifyMutation.mutate(token);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Verify Pickup QR Code
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Scan the subscriber's phone screen or enter their signed pickup token manually.
        </p>
      </div>

      <QrScanner
        onVerify={handleVerify}
        isVerifying={verifyMutation.isPending}
        verifyResult={verifyResult}
      />
    </div>
  );
};

