import React from 'react';
import { Ban, LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const SuspendedNotice = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-terracotta-200 p-8 text-center shadow-warm">
        <div className="w-16 h-16 rounded-3xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center mx-auto mb-4">
          <Ban className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-neutral-900">
          Account Suspended
        </h2>

        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
          Your ChiefNet account has been temporarily suspended by system administrators due to policy violations, hygiene reports, or repeated missed pickups.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-left text-xs space-y-2 text-neutral-600">
          <p className="font-semibold text-neutral-800">What does this mean?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Active meal subscriptions and reservations are halted.</li>
            <li>Kitchen listings are hidden from neighbourhood discovery.</li>
            <li>New orders and pickup tokens cannot be generated.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            fullWidth
            icon={LifeBuoy}
            onClick={() => window.location.href = 'mailto:support@chiefnet.com'}
          >
            Contact ChiefNet Support
          </Button>

          <Button
            variant="ghost"
            fullWidth
            icon={LogOut}
            onClick={logout}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

