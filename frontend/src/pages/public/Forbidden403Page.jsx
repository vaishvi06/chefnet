import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const Forbidden403Page = () => {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-cream-200 shadow-warm">
        <div className="w-16 h-16 rounded-3xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold text-terracotta-600 tracking-wider uppercase">
          403 Forbidden
        </span>
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
          Access Restricted
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          You do not have permission to access this area. This section is reserved for another user role or administrative operations.
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

