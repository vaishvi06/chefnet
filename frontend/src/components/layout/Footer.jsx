import React from 'react';
import { Heart, UtensilsCrossed, ShieldCheck, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-cream-200 mt-auto py-10 text-neutral-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-saffron-300" />
              </div>
              <span className="font-serif text-lg font-bold text-primary-900">
                Chief<span className="text-saffron-600">Net</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Hyperlocal homemade-food subscriptions connecting verified home kitchens with neighbours within 1 km. Zero delivery fees, zero food-aggregator commission, pure authentic home cooking.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-600" /> Max 1 km radius
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-saffron-600" /> Verified kitchens
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>Self-Pickup Model</li>
              <li>Subscription Plans (Weekly / Monthly)</li>
              <li>QR Digital Pickup Pass</li>
              <li>Direct Kitchen Chat</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">
              Transparency
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              ChiefNet operates as a direct peer-to-peer neighborhood food platform. Payments are arranged offline directly between subscribers and home chefs without intermediary fees.
            </p>
          </div>
        </div>

        <div className="border-t border-cream-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3">
          <p>© {new Date().getFullYear()} ChiefNet. Built with love for neighborhood home kitchens.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-terracotta-500 fill-terracotta-500" /> for Bengaluru communities
          </p>
        </div>
      </div>
    </footer>
  );
};

