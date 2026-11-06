import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CustomerNotFoundPage = () => {
  return (
    <div className="py-12 flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-cream-200 shadow-warm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-cream-200 text-neutral-600 flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-7 h-7" />
        </div>
        <span className="text-xs font-mono font-bold text-neutral-400 tracking-wider uppercase">
          404 Customer Portal
        </span>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
          Section Not Found
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
          The customer section or page you requested does not exist or has been relocated.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/customer/discover">
            <Button variant="primary" size="md" icon={Compass}>
              Discover Nearby Kitchens
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

