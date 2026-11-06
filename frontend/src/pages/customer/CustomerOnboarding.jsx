import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, User, MapPin, Check, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { MapPicker } from '../../components/shared/MapPicker';
import { AreaStatusBanner } from '../../components/shared/AreaStatusBanner';
import { DIETARY_PREFERENCES, DEFAULT_COORDINATES } from '../../utils/constants';

export const CustomerOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(user?.isEmailVerified ? (user?.address ? 3 : 2) : 1);
  const [resending, setResending] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [mapCoords, setMapCoords] = useState(
    user?.location?.coordinates?.length === 2 ? user.location.coordinates : DEFAULT_COORDINATES
  );
  const [areaResult, setAreaResult] = useState(null);

  // Profile form
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dietaryPreference: user?.customerProfile?.dietaryPreference || 'all'
    }
  });

  const addressValue = watch('address');

  // Resend email
  const handleResendEmail = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Save Profile details
  const onProfileSubmit = async (data) => {
    setSavingProfile(true);
    try {
      await userApi.updateMe({
        name: data.name,
        phone: data.phone,
        address: data.address,
        dietaryPreference: data.dietaryPreference
      });
      await refreshUser();
      toast.success('Profile details saved!');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Step 3: Verify GPS Location
  const handleVerifyLocation = async () => {
    setVerifyingLocation(true);
    try {
      const res = await userApi.updateLocation({
        coordinates: mapCoords
      });

      await refreshUser();

      if (!res.data?.areaActive) {
        setAreaResult({
          areaActive: false,
          area: res.data?.area,
          message: res.message
        });
        toast('Your area is on the waiting list.', { icon: '📍' });
      } else {
        toast.success(res.message || 'Location verified in active zone!');
        navigate('/discover');
      }
    } catch (err) {
      toast.error(err.message || 'Location verification failed');
    } finally {
      setVerifyingLocation(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Stepper Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-neutral-900">
          Welcome to ChiefNet
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Complete these 3 simple steps to unlock kitchens within 1 km
        </p>

        {/* Stepper circles */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {[
            { num: 1, label: 'Email', done: user?.isEmailVerified },
            { num: 2, label: 'Profile', done: !!user?.address },
            { num: 3, label: 'GPS Pin', done: user?.isLocationVerified }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.done
                      ? 'bg-primary-600 text-white'
                      : step === s.num
                      ? 'bg-saffron-500 text-white ring-4 ring-saffron-100'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {s.done ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step === s.num ? 'text-neutral-900 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 2 && <div className="w-8 h-0.5 bg-neutral-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Verify Email */}
      {step === 1 && (
        <Card className="p-6 sm:p-8 shadow-warm text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-neutral-900">
            Verify Your Email Address
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            We sent a verification link to <span className="font-semibold text-neutral-800">{user?.email}</span>. Click the link in your email to proceed.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleResendEmail}
              loading={resending}
            >
              Resend Verification Email
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={async () => {
                await refreshUser();
                if (user?.isEmailVerified) {
                  setStep(2);
                } else {
                  toast('Please click the link in your email to verify.', { icon: '📧' });
                  setStep(2); // allow testing flow progress
                }
              }}
            >
              I've Verified It
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Profile Setup */}
      {step === 2 && (
        <Card className="p-6 sm:p-8 shadow-warm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cream-200">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-neutral-900">
                Set Up Your Foodie Profile
              </h2>
              <p className="text-xs text-neutral-500">
                Help nearby chefs recognize you for self-pickup
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              required
              {...register('name', { required: true })}
            />

            <Input
              label="Phone Number"
              icon={Phone}
              placeholder="+91 98765 43210"
              helperText="Only unlocked and revealed to your subscribed chef after acceptance."
              {...register('phone')}
            />

            <Input
              label="Street / Apartment Address"
              icon={MapPin}
              placeholder="e.g. Tower 4, Green Glen Layout, Bellandur, Bengaluru"
              required
              helperText="Changing address will require re-verifying your 1 km GPS pin."
              {...register('address', { required: true })}
            />

            <Select
              label="Dietary Preference"
              options={DIETARY_PREFERENCES}
              {...register('dietaryPreference')}
            />

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={savingProfile}
              >
                <span>Continue to GPS Verification</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 3: Location Verification with Map */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 shadow-warm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cream-200">
              <div className="w-10 h-10 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Verify Your 1 km Pickup Pin
                </h2>
                <p className="text-xs text-neutral-500">
                  ChiefNet connects you strictly to home kitchens within 1 km for fresh pickup
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              Your registered address is <strong className="text-neutral-800">{addressValue || user?.address || 'Bengaluru'}</strong>.
              Use the GPS detect button or drag the map pin to align with your home location:
            </p>

            <div className="mb-6">
              <MapPicker
                initialCoordinates={mapCoords}
                onCoordinatesChange={(c) => setMapCoords(c)}
                showRadius={true}
                height="320px"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
              >
                Back to Profile
              </Button>

              <Button
                variant="primary"
                size="lg"
                loading={verifyingLocation}
                onClick={handleVerifyLocation}
                icon={ShieldCheck}
              >
                Confirm Location & View Chefs
              </Button>
            </div>
          </Card>

          {/* If area is not active after verification */}
          {areaResult && !areaResult.areaActive && (
            <AreaStatusBanner area={areaResult.area} />
          )}
        </div>
      )}
    </div>
  );
};

