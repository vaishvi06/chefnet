import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  MapPin,
  Lock,
  Phone,
  ShieldCheck,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Utensils,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/userApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MapPicker } from '../../components/shared/MapPicker';
import { Modal } from '../../components/ui/Modal';
import { DIETARY_PREFERENCES, DEFAULT_COORDINATES } from '../../utils/constants';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordErrorMsg =
  'Password must be at least 8 characters long and contain at least one letter and one number';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().regex(passwordPattern, passwordErrorMsg),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  });

export const CustomerProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [locationSource, setLocationSource] = useState('pin');

  // Photo upload state
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState(null);

  const [coords, setCoords] = useState(
    user?.location?.coordinates?.length === 2 &&
      (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)
      ? user.location.coordinates
      : DEFAULT_COORDINATES
  );

  const isChef = user?.role === 'chef';

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { isSubmitting: isProfileSubmitting }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dietaryPreference: user?.customerProfile?.dietaryPreference || 'all',
      kitchenName: user?.chefProfile?.kitchenName || '',
      description: user?.chefProfile?.description || '',
      operatingHours: user?.chefProfile?.operatingHours || '07:00 - 21:00',
      dailyCapacity: user?.chefProfile?.dailyCapacity || 20,
      maxSubscribers: user?.chefProfile?.maxSubscribers || 15
    }
  });

  // Password Form
  const {
    register: registerPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting }
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be under 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onProfileSave = async (data) => {
    try {
      const addressChanged = user?.address && data.address !== user.address;

      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('name', data.name);
        if (data.phone) formData.append('phone', data.phone);
        if (data.address) formData.append('address', data.address);
        if (isChef) {
          if (data.kitchenName) formData.append('kitchenName', data.kitchenName);
          if (data.description) formData.append('description', data.description);
          if (data.operatingHours) formData.append('operatingHours', data.operatingHours);
          if (data.dailyCapacity) formData.append('dailyCapacity', data.dailyCapacity);
          if (data.maxSubscribers) formData.append('maxSubscribers', data.maxSubscribers);
        } else {
          formData.append('dietaryPreference', data.dietaryPreference);
        }
        await userApi.updateMe(formData);
      } else {
        const payload = {
          name: data.name,
          phone: data.phone,
          address: data.address
        };
        if (isChef) {
          payload.kitchenName = data.kitchenName;
          payload.description = data.description;
          payload.operatingHours = data.operatingHours;
          payload.dailyCapacity = data.dailyCapacity;
          payload.maxSubscribers = data.maxSubscribers;
        } else {
          payload.dietaryPreference = data.dietaryPreference;
        }
        await userApi.updateMe(payload);
      }

      await refreshUser();
      toast.success('Profile saved successfully!');

      if (addressChanged) {
        if (isChef) {
          toast.warn('Address updated. Re-verification by an administrator is required before serving meals.', {
            duration: 6000
          });
        }
        setMapModalOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const onPasswordSave = async (data) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully!');
      resetPass();
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  const handleConfirmLocation = async () => {
    try {
      const res = await userApi.updateLocation({
        coordinates: coords,
        locationSource
      });
      await refreshUser();
      setMapModalOpen(false);
      toast.success(res.message || 'Location updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Location update failed');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          {isChef
            ? 'Manage your home kitchen profile, operating hours, and location.'
            : 'Manage your personal details, dietary preferences, and self-pickup location.'}
        </p>
      </div>

      {/* Chef Status Alert if pending or rejected */}
      {isChef && user?.chefProfile?.verificationStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Kitchen Verification Pending</p>
            <p className="text-amber-800 text-xs mt-0.5">
              Your kitchen application is currently being reviewed by ChiefNet administrators. You will be notified once approved to list daily meals.
            </p>
          </div>
        </div>
      )}

      {isChef && user?.chefProfile?.verificationStatus === 'rejected' && (
        <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 flex items-start gap-3 text-terracotta-900">
          <AlertTriangle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Kitchen Application Requires Attention</p>
            <p className="text-terracotta-800 text-xs mt-0.5">
              Reason: {user.chefProfile.rejectionReason || 'Please review hygiene and address documentation.'}
            </p>
          </div>
        </div>
      )}

      {/* Trust & Location Summary Banner */}
      <Card className="p-5 border-cream-300 bg-cream-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-primary-100 border-2 border-primary-300 text-primary-800 flex items-center justify-center font-bold text-2xl uppercase overflow-hidden shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-neutral-900">
                {isChef && user?.chefProfile?.kitchenName ? user.chefProfile.kitchenName : user?.name}
              </h3>
              {isChef && user?.chefProfile?.kitchenCode && (
                <Badge variant="outline" size="sm" className="font-mono text-[11px] bg-white text-primary-800 border-primary-300">
                  {user.chefProfile.kitchenCode}
                </Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={user?.isLocationVerified ? 'success' : 'warning'} size="sm">
                {user?.isLocationVerified ? '1 km GPS Verified' : 'Location Unverified'}
              </Badge>
              {isChef ? (
                <Badge
                  variant={user?.chefProfile?.verificationStatus === 'approved' ? 'success' : 'warning'}
                  size="sm"
                >
                  Status: {user?.chefProfile?.verificationStatus || 'pending'}
                </Badge>
              ) : (
                <Badge variant="primary" size="sm">
                  Trust Score: {user?.trustScore ?? 100}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={MapPin}
          onClick={() => setMapModalOpen(true)}
          className="bg-white shrink-0"
        >
          Change GPS Location
        </Button>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-cream-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-800 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          {isChef ? 'Kitchen & Profile' : 'General Profile'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-3 px-6 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-800 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Password & Security
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card className="p-6 border-cream-300">
          <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                {...registerProfile('name', { required: true })}
              />

              <Input
                label="Phone Number"
                icon={Phone}
                placeholder="+91 98765 43210"
                helperText="Direct contact used for offline meal coordination."
                {...registerProfile('phone')}
              />
            </div>

            {/* Chef-specific fields */}
            {isChef && (
              <>
                <Input
                  label="Home Kitchen Name"
                  icon={Utensils}
                  placeholder="e.g. Grandma's Gujarati Rasoi"
                  required
                  {...registerProfile('kitchenName', { required: isChef })}
                />

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Kitchen Bio / Cooking Specialty
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your culinary heritage, hygiene habits, and traditional specialties..."
                    className="w-full text-xs p-2.5 rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-cream-50"
                    {...registerProfile('description')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Operating Hours"
                    icon={Clock}
                    placeholder="07:30 - 21:00"
                    {...registerProfile('operatingHours')}
                  />
                  <Input
                    label="Daily Capacity"
                    type="number"
                    min={1}
                    max={100}
                    {...registerProfile('dailyCapacity', { valueAsNumber: true })}
                  />
                  <Input
                    label="Max Active Subscribers"
                    type="number"
                    min={1}
                    max={50}
                    {...registerProfile('maxSubscribers', { valueAsNumber: true })}
                  />
                </div>
              </>
            )}

            {/* Customer-specific fields */}
            {!isChef && (
              <Select
                label="Dietary Preference"
                options={DIETARY_PREFERENCES}
                {...registerProfile('dietaryPreference')}
              />
            )}

            <Input
              label={isChef ? 'Kitchen Physical Address' : 'Pickup / Residence Address'}
              icon={MapPin}
              placeholder="Full building and street address"
              required
              helperText={
                isChef
                  ? 'Important: Changing your kitchen address will automatically reset your verification status to pending review.'
                  : 'Note: Changing your street address updates your 1 km pickup zone.'
              }
              {...registerProfile('address', { required: true })}
            />

            <div className="pt-3 flex justify-end">
              <Button type="submit" variant="primary" loading={isProfileSubmitting}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <Card className="p-6 border-cream-300 max-w-lg">
          <form onSubmit={handlePassSubmit(onPasswordSave)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              icon={Lock}
              required
              error={passErrors.currentPassword?.message}
              {...registerPass('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="Min. 8 chars with letter & number"
              required
              error={passErrors.newPassword?.message}
              {...registerPass('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={Lock}
              required
              error={passErrors.confirmPassword?.message}
              {...registerPass('confirmPassword')}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" loading={isPassSubmitting}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Map Verification Modal with 3 ways to change location */}
      <Modal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title="Change 1 km GPS Location"
        description="Choose your location by searching an address, using device GPS, or dragging the map pin."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <MapPicker
            initialCoordinates={coords}
            onCoordinatesChange={(c, src) => {
              setCoords(c);
              if (src) setLocationSource(src);
            }}
            onAddressSelected={(addr) => {
              setProfileValue('address', addr);
            }}
            showRadius={true}
            showSearch={true}
            height="320px"
          />

          <div className="p-3 bg-cream-100 rounded-xl text-xs text-neutral-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
            <p>
              ChiefNet operates on a strict <strong>1 km self-pickup perimeter</strong>. You will only discover home kitchens within walking distance of this saved pin.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setMapModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmLocation}>
              Save New Location
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
