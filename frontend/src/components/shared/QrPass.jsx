import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Clock, Sun, ShieldCheck, KeyRound } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatTime } from '../../utils/formatters';

export const QrPass = ({
  qrToken,
  manualToken,
  mealName,
  mealType,
  reserveDate,
  pickupWindow,
  chefName,
  chefKitchen,
  chefAddress,
  status = 'ready'
}) => {
  return (
    <Card className="max-w-sm mx-auto overflow-hidden border-2 border-primary-200 shadow-warm-lg bg-white">
      {/* Top Banner */}
      <div className="bg-primary-700 text-white p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-saffron-300">
          <ShieldCheck className="w-4 h-4" />
          <span>ChiefNet Digital Pickup Pass</span>
        </div>
        <h4 className="mt-1 font-serif text-lg font-bold truncate">
          {mealName || 'Homemade Meal'}
        </h4>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-xs text-primary-100 capitalize">
            {mealType} Plan
          </span>
          <span className="text-xs text-primary-200">•</span>
          <span className="text-xs text-primary-100">
            {reserveDate}
          </span>
        </div>
      </div>

      {/* QR Code Container (High-contrast, brightness friendly) */}
      <div className="p-6 bg-neutral-900 flex flex-col items-center justify-center">
        <div className="p-3 bg-white rounded-2xl shadow-lg ring-4 ring-white">
          <QRCodeSVG
            value={qrToken || manualToken || 'chiefnet-empty'}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-300">
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Increase screen brightness when showing to Chef</span>
        </div>
      </div>

      {/* Manual Code Backup Section */}
      {manualToken && (
        <div className="px-5 py-3 bg-cream-100 border-t border-b border-cream-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary-700" />
            <span className="text-xs font-semibold text-neutral-700">Manual Pickup Code:</span>
          </div>
          <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-lg bg-white border border-cream-300 text-primary-900 tracking-wider shadow-2xs">
            {manualToken}
          </span>
        </div>
      )}

      {/* Pickup Details */}
      <div className="p-4 bg-cream-50 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-medium">Status</span>
          <Badge
            variant={status === 'ready' ? 'success' : status === 'picked_up' ? 'neutral' : 'warning'}
            dot
          >
            {status === 'ready' ? 'Ready for Pickup' : status === 'picked_up' ? 'Picked Up' : status}
          </Badge>
        </div>

        {pickupWindow && (
          <div className="flex items-start gap-2 text-xs text-neutral-700">
            <Clock className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Pickup Window:</span>
              <span className="text-neutral-600">
                {formatTime(pickupWindow.start)} – {formatTime(pickupWindow.end)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-neutral-700">
          <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">
              {chefKitchen || chefName || 'Home Kitchen'}
            </span>
            <span className="text-neutral-600 leading-snug">
              {chefAddress || 'Address available after reservation'}
            </span>
          </div>
        </div>

        {qrToken && (
          <div className="pt-2 border-t border-cream-200 text-center">
            <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
              Token ID: {qrToken.slice(0, 16)}...
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
