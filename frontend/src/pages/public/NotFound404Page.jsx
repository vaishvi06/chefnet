import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFound404Page = () => {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-cream-200 shadow-warm">
        <div className="w-16 h-16 rounded-3xl bg-cream-200 text-neutral-600 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold text-neutral-400 tracking-wider uppercase">
          404 Page Not Found
        </span>
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
          Lost in the Neighbourhood?
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          The page or recipe you are looking for does not exist or has been relocated to another address.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="primary" size="md" icon={Home}>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

