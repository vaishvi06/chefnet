import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Calendar,
  PlusCircle,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dailyMenuApi } from '../../api/dailyMenuApi';
import { mealApi } from '../../api/mealApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { MEAL_TYPES } from '../../utils/constants';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';

export const DailyMenuPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMealIds, setSelectedMealIds] = useState([]);

  // Fetch Chef's Daily Menus
  const { data: menuData, isLoading: isMenusLoading } = useQuery({
    queryKey: ['chefDailyMenus', user?._id],
    queryFn: () => dailyMenuApi.getDailyMenus({ chef: user?._id, limit: 50 }),
    enabled: !!user?._id
  });

  // Fetch Chef's Meals for checkbox selection
  const { data: mealsData } = useQuery({
    queryKey: ['chefMeals', user?._id],
    queryFn: () => mealApi.getMeals({ chef: user?._id, isPaused: false }),
    enabled: modalOpen && !!user?._id
  });

  const dailyMenus = menuData?.data?.dailyMenus || [];
  const meals = mealsData?.data?.meals || [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      menuDate: todayStr,
      mealType: 'lunch',
      pickupStart: '12:30',
      pickupEnd: '14:30',
      cutoffHour: '11:00',
      quantityAvailable: 15
    }
  });

  const watchedMealType = watch('mealType');
  const filteredMeals = meals.filter((m) => m.mealType === watchedMealType);

  const createMenuMutation = useMutation({
    mutationFn: (payload) => dailyMenuApi.createDailyMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chefDailyMenus'] });
      setModalOpen(false);
      setSelectedMealIds([]);
      reset();
      toast.success('Daily menu published! Subscribers can now place reservations.');
    },
    onError: (err) => toast.error(err.message || 'Failed to publish menu')
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id) => dailyMenuApi.deleteDailyMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chefDailyMenus'] });
      toast.success('Menu removed');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete menu')
  });

  const onSubmit = (formData) => {
    if (selectedMealIds.length === 0) {
      toast.error('Please select at least one dish for this menu');
      return;
    }

    // Build cutoff Date object
    const [cHours, cMins] = formData.cutoffHour.split(':').map(Number);
    const cutoffDate = new Date(formData.menuDate);
    cutoffDate.setHours(cHours, cMins, 0, 0);

    createMenuMutation.mutate({
      menuDate: formData.menuDate,
      mealType: formData.mealType,
      meals: selectedMealIds,
      pickupStart: formData.pickupStart,
      pickupEnd: formData.pickupEnd,
      cutoffTime: cutoffDate,
      quantityAvailable: Number(formData.quantityAvailable)
    });
  };

  const toggleMealSelect = (id) => {
    setSelectedMealIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Daily Menu Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Build and publish menus for breakfast, lunch, and dinner with cutoff countdown timers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => {
            setSelectedMealIds([]);
            setModalOpen(true);
          }}
        >
          Publish Menu
        </Button>
      </div>

      {/* Menus List */}
      {isMenusLoading ? (
        <Skeleton variant="card" count={3} />
      ) : dailyMenus.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Scheduled Menus"
          description="Publish a menu for today or upcoming days to allow your subscribers to reserve meals."
          actionLabel="Publish First Menu"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dailyMenus.map((menu) => (
            <Card key={menu._id} className="p-5 border-cream-300 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="primary" size="sm" className="capitalize">
                    {menu.mealType}
                  </Badge>
                  <h3 className="font-serif font-bold text-lg text-neutral-900 mt-1">
                    {formatDate(menu.menuDate, 'EEEE, dd MMMM yyyy')}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <CountdownTimer cutoffTime={menu.cutoffTime} />
                  <button
                    onClick={() => deleteMenuMutation.mutate(menu._id)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                    title="Delete menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dishes list */}
              <div className="space-y-1.5 pt-2 border-t border-cream-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Included Dishes:
                </p>
                {menu.meals?.map((dish) => (
                  <div
                    key={dish._id}
                    className="flex items-center justify-between text-xs p-2 bg-cream-50 rounded-xl border border-cream-200"
                  >
                    <div>
                      <span className="font-bold text-neutral-800">{dish.name}</span>
                      <span className="text-[10px] text-neutral-500 ml-2 capitalize">
                        ({dish.category?.replace('_', ' ')})
                      </span>
                    </div>
                    <span className="font-bold text-primary-800">
                      {formatCurrency(dish.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pickup & Quantity metadata */}
              <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-saffron-600" />
                  Pickup: <strong>{formatTime(menu.pickupStart)} – {formatTime(menu.pickupEnd)}</strong>
                </span>

                <span className="flex items-center gap-1">
                  Quantity: <strong className="text-primary-800">{menu.quantityAvailable} available</strong>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Menu Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Daily Kitchen Menu"
        description="Choose meal date, dishes, pickup window, and order cutoff time."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Menu Date"
              type="date"
              required
              {...register('menuDate', { required: true })}
            />

            <Select
              label="Meal Type"
              options={MEAL_TYPES}
              {...register('mealType')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pickup Start Time"
              type="time"
              required
              {...register('pickupStart', { required: true })}
            />

            <Input
              label="Pickup End Time"
              type="time"
              required
              {...register('pickupEnd', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reservation Cutoff Time"
              type="time"
              required
              helperText="e.g. 11:00 AM for lunch"
              {...register('cutoffHour', { required: true })}
            />

            <Input
              label="Portions / Quantity Available"
              type="number"
              required
              placeholder="e.g. 20"
              {...register('quantityAvailable', { required: true })}
            />
          </div>

          {/* Dish Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Select Dishes to Cook ({watchedMealType})
            </label>

            {filteredMeals.length === 0 ? (
              <p className="text-xs text-neutral-500 p-3 bg-cream-100 rounded-xl">
                No active {watchedMealType} dishes found in your catalog. Please add some under "Dish Catalog" first.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {filteredMeals.map((dish) => {
                  const isChecked = selectedMealIds.includes(dish._id);
                  return (
                    <div
                      key={dish._id}
                      onClick={() => toggleMealSelect(dish._id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                          : 'border-cream-300 hover:border-primary-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-neutral-900">{dish.name}</p>
                        <p className="text-[10px] text-neutral-500">{dish.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary-800">
                          {formatCurrency(dish.price)}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-cream-200">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={createMenuMutation.isPending || isSubmitting}
            >
              Publish Menu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

