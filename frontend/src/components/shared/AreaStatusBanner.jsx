import React from 'react';
import { MapPinOff, Users, Bell, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const AreaStatusBanner = ({ area, waitingListCount }) => {
  const demandCount = area?.demandCount || waitingListCount || 12;
  const threshold = area?.activationThreshold || 3;

  return (
    <Card className="max-w-2xl mx-auto my-8 border-2 border-saffron-300 bg-saffron-50/40 p-6 sm:p-8 text-center shadow-warm">
      <div className="w-16 h-16 rounded-3xl bg-saffron-100 text-saffron-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <MapPinOff className="w-8 h-8" />
      </div>

      <Badge variant="warning" size="md" className="mb-2">
        Waiting List Active
      </Badge>

      <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
        Your Area Isn't Live Yet
      </h2>

      <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        We require at least <strong className="text-neutral-800">{threshold} verified home chefs</strong> in{' '}
        <span className="font-semibold text-primary-700">{area?.name || 'your neighbourhood'}</span> before launching
        hyperlocal subscriptions to guarantee reliable fresh daily meals.
      </p>

      {/* Demand Counter Box */}
      <div className="my-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="p-4 bg-white rounded-xl border border-saffron-200 shadow-xs">
          <div className="flex items-center justify-center text-saffron-600 mb-1">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold font-serif text-neutral-900 block">
            {demandCount}
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            Foodies on Waiting List
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-saffron-200 shadow-xs">
          <div className="flex items-center justify-center text-primary-600 mb-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold font-serif text-neutral-900 block">
            {threshold}
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            Chefs Needed to Unlock
          </span>
        </div>
      </div>

      {/* What happens next */}
      <div className="text-left bg-white p-5 rounded-2xl border border-cream-300 max-w-lg mx-auto space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          What happens next?
        </h4>
        <div className="flex items-start gap-3 text-xs text-neutral-600">
          <span className="w-5 h-5 rounded-full bg-cream-200 text-neutral-700 flex items-center justify-center font-bold shrink-0">1</span>
          <span>You are registered on the neighbourhood priority waiting list.</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-neutral-600">
          <span className="w-5 h-5 rounded-full bg-cream-200 text-neutral-700 flex items-center justify-center font-bold shrink-0">2</span>
          <span>Local home chefs are completing kitchen onboarding and safety checks.</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-neutral-600">
          <span className="w-5 h-5 rounded-full bg-cream-200 text-neutral-700 flex items-center justify-center font-bold shrink-0">3</span>
          <span>As soon as the area activates, you will receive an instant notification to discover chefs within 1 km!</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
        <Bell className="w-4 h-4 text-saffron-600" />
        <span>Discovery remains locked until your locality is activated.</span>
      </div>
    </Card>
  );
};

