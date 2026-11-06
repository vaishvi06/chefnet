import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ChefHat,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Users,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { chefApi } from '../../api/chefApi';
import { userApi } from '../../api/userApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MapPicker } from '../../components/shared/MapPicker';
import { DEFAULT_COORDINATES } from '../../utils/constants';

export const ChefOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [coords, setCoords] = useState(
    user?.location?.coordinates?.length === 2 && user.location.coordinates[0] !== 0
      ? user.location.coordinates
      : DEFAULT_COORDINATES
  );
  const [submitting, setSubmitting] = useState(false);

  // Status Tracker calculation
  const isEmailDone = !!user?.isEmailVerified;
  const isLocationDone = !!user?.isLocationVerified;
  const isApproved = user?.chefProfile?.verificationStatus === 'approved';
  const isPending = user?.chefProfile?.verificationStatus === 'pending';

  const { register, handleSubmit } = useForm({
    defaultValues: {
      kitchenName: user?.chefProfile?.kitchenName || `${user?.name}'s Home Kitchen`,
      operatingHours: user?.chefProfile?.operatingHours || '07:30 - 21:30',
      dailyCapacity: user?.chefProfile?.dailyCapacity || 25,
      maxSubscribers: user?.chefProfile?.maxSubscribers || 18,
      address: user?.address || ''
    }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // 1. Update basic kitchen & address details
      await userApi.updateMe({
        address: data.address
      });

      // 2. Register kitchen configuration
      await chefApi.registerKitchen({
        kitchenName: data.kitchenName,
        operatingHours: data.operatingHours,
        dailyCapacity: Number(data.dailyCapacity),
        maxSubscribers: Number(data.maxSubscribers)
      });

      // 3. Verify GPS pin
      await userApi.updateLocation({
        coordinates: coords
      });

      await refreshUser();
      toast.success('Kitchen details submitted for administrative approval!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit kitchen details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Tracker Banner */}
      <div className="text-center">
        <h1 className="text-3xl font-serif font-bold text-neutral-900">
          Home Kitchen Onboarding
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Complete kitchen registration to start feeding subscribers within 1 km
        </p>

        {/* 4-Step Status Tracker */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {[
            { id: 1, label: 'Email Verified', done: isEmailDone, active: !isEmailDone },
            { id: 2, label: 'GPS Pin Verified', done: isLocationDone, active: isEmailDone && !isLocationDone },
            { id: 3, label: 'Admin Approval', done: isApproved, active: isLocationDone && isPending },
            { id: 4, label: 'Kitchen Live', done: isApproved, active: false }
          ].map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                t.done
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : t.active
                  ? 'bg-saffron-50 border-saffron-300 text-saffron-900 ring-2 ring-saffron-200'
                  : 'bg-white border-cream-200 text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                {t.done ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-cream-200 text-[10px] flex items-center justify-center text-neutral-600">
                    {t.id}
                  </span>
                )}
                <span>Step {t.id}</span>
              </div>
              <p className="text-xs font-semibold">{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* If Approved Banner */}
      {isApproved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Kitchen is Verified & Live!</p>
              <p className="text-xs text-emerald-700">You are accepting subscriptions and can publish daily menus.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/chef/dashboard')}>
            Go to Kitchen Dashboard
          </Button>
        </div>
      )}

      {/* Kitchen Details Form */}
      <Card className="p-6 sm:p-8 border-cream-300 shadow-warm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-cream-200">
            <div className="w-10 h-10 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-neutral-900">
                Kitchen Profile & Operating Limits
              </h3>
              <p className="text-xs text-neutral-500">
                Set realistic capacities so you can deliver exceptional home cooking
              </p>
            </div>
          </div>

          <Input
            label="Kitchen / Business Name"
            icon={ChefHat}
            required
            placeholder="e.g. Annapurna Homestyle Kitchen"
            {...register('kitchenName', { required: true })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Operating Hours"
              icon={Clock}
              placeholder="e.g. 07:30 - 21:30"
              required
              {...register('operatingHours', { required: true })}
            />

            <Input
              label="Daily Meal Capacity"
              type="number"
              placeholder="e.g. 25"
              required
              helperText="Max meals per day"
              {...register('dailyCapacity', { required: true })}
            />

            <Input
              label="Max Active Subscribers"
              type="number"
              placeholder="e.g. 18"
              required
              helperText="Auto-caps subscription queue"
              {...register('maxSubscribers', { required: true })}
            />
          </div>

          <Input
            label="Physical Kitchen Pickup Address"
            icon={MapPin}
            placeholder="e.g. Villa 14, Green Glen Layout, Bellandur, Bengaluru"
            required
            helperText="Where subscribers will walk to pick up their tiffins."
            {...register('address', { required: true })}
          />

          {/* Map Location Verification */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Kitchen 1 km Geofence GPS Pin <span className="text-terracotta-600">*</span>
            </label>
            <p className="text-xs text-neutral-500">
              Click or drag the pin to your exact kitchen location. Only customers within 1 km can discover and subscribe to you.
            </p>
            <MapPicker
              initialCoordinates={coords}
              onCoordinatesChange={(c) => setCoords(c)}
              showRadius={true}
              height="300px"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-cream-200">
            <div className="text-xs text-neutral-500">
              {isPending && !isApproved && (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Application submitted — Awaiting admin approval.
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              icon={ShieldCheck}
            >
              Save & Submit for Approval
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

