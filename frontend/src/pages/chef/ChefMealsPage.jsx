import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  UtensilsCrossed,
  PlusCircle,
  Pause,
  Play,
  Trash2,
  Edit2,
  Leaf,
  Sparkles,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { MEAL_CATEGORIES, MEAL_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export const ChefMealsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [deleteMealId, setDeleteMealId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chefMeals', user?._id],
    queryFn: () => mealApi.getMeals({ chef: user?._id, limit: 100 }),
    enabled: !!user?._id
  });

  const meals = data?.data?.meals || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: 'gujarati',
      mealType: 'lunch',
      isVeg: true,
      isJain: false
    }
  });

  const handleOpenAdd = () => {
    setEditingMeal(null);
    setPhotoPreview(null);
    reset({
      name: '',
      description: '',
      price: '',
      category: 'gujarati',
      mealType: 'lunch',
      isVeg: true,
      isJain: false
    });
    setMealModalOpen(true);
  };

  const handleOpenEdit = (meal) => {
    setEditingMeal(meal);
    setPhotoPreview(meal.photoUrl || null);
    reset({
      name: meal.name,
      description: meal.description,
      price: meal.price,
      category: meal.category,
      mealType: meal.mealType,
      isVeg: meal.isVeg,
      isJain: meal.isJain
    });
    setMealModalOpen(true);
  };

  // Create / Update Meal Mutation
  const saveMealMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingMeal) {
        return mealApi.updateMeal(editingMeal._id, formData);
      }
      return mealApi.createMeal(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chefMeals'] });
      setMealModalOpen(false);
      toast.success(editingMeal ? 'Meal updated!' : 'New meal added to catalog!');
    },
    onError: (err) => toast.error(err.message || 'Failed to save meal')
  });

  // Toggle Pause Mutation
  const togglePauseMutation = useMutation({
    mutationFn: ({ id, isPaused }) => mealApi.togglePauseMeal(id, isPaused),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chefMeals'] });
      toast.success(res.message || 'Status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to toggle status')
  });

  // Soft Remove Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => mealApi.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chefMeals'] });
      setDeleteMealId(null);
      toast.success('Meal removed from catalog');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete meal')
  });

  const onFormSubmit = (values) => {
    saveMealMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Dish Catalog
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Create and maintain your home culinary dishes used when building daily menus.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={PlusCircle} onClick={handleOpenAdd}>
          Add New Dish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" count={3} />
        </div>
      ) : meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No Dishes in Your Catalog"
          description="Add your first homemade recipe (Gujarati thali, Rajma chawal, Ghee podi idli, etc.) to start scheduling menus."
          actionLabel="Add First Dish"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <Card
              key={meal._id}
              className={`p-5 border-cream-300 space-y-3 flex flex-col justify-between ${
                meal.isPaused ? 'bg-cream-100/50 opacity-80' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={meal.isVeg ? 'success' : 'neutral'} size="sm">
                    {meal.isJain ? '🌿 Pure Jain' : meal.isVeg ? '🌱 Pure Veg' : 'Non-Veg'}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {meal.isPaused && (
                      <Badge variant="warning" size="sm">
                        Paused
                      </Badge>
                    )}
                    <span className="font-serif font-bold text-primary-800 text-base">
                      {formatCurrency(meal.price)}
                    </span>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-base text-neutral-900">
                  {meal.name}
                </h3>

                <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                  {meal.description || 'Traditional homestyle preparation.'}
                </p>

                <div className="mt-3 pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="capitalize">
                    Category: <strong>{meal.category?.replace('_', ' ')}</strong>
                  </span>
                  <span className="capitalize">
                    Meal: <strong>{meal.mealType}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-cream-200 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(meal)}
                >
                  Edit
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={meal.isPaused ? Play : Pause}
                    onClick={() =>
                      togglePauseMutation.mutate({
                        id: meal._id,
                        isPaused: !meal.isPaused
                      })
                    }
                  >
                    {meal.isPaused ? 'Resume' : 'Pause'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setDeleteMealId(meal._id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                    title="Remove dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Meal Modal */}
      <Modal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        title={editingMeal ? 'Edit Dish Details' : 'Add New Dish to Catalog'}
        description="Specify dish ingredients, pricing, and dietary preferences for your subscribers."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <Input
            label="Dish Name"
            placeholder="e.g. Kathiyawadi Thali with Bajra Rotla"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Dish name is required' })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Description & Items Included
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 2 hot bajra rotlas, ringna no olo, sev tameta curry, fresh white butter, jaggery"
              className="w-full rounded-xl border border-cream-300 p-3 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Price (₹ INR)"
              type="number"
              placeholder="120"
              required
              error={errors.price?.message}
              {...register('price', { required: 'Price is required' })}
            />

            <Select
              label="Cuisine Category"
              options={MEAL_CATEGORIES}
              {...register('category')}
            />

            <Select
              label="Meal Type"
              options={MEAL_TYPES}
              {...register('mealType')}
            />
          </div>

          {/* Dietary Checkboxes */}
          <div className="pt-2 border-t border-cream-200 flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                {...register('isVeg')}
              />
              <span>🌱 Pure Vegetarian</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                {...register('isJain')}
              />
              <span>🌿 Pure Jain (No Onion/Garlic/Potato)</span>
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-cream-200">
            <Button variant="ghost" size="sm" onClick={() => setMealModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saveMealMutation.isPending || isSubmitting}
            >
              {editingMeal ? 'Update Dish' : 'Save Dish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      {deleteMealId && (
        <ConfirmDialog
          isOpen={!!deleteMealId}
          onClose={() => setDeleteMealId(null)}
          title="Remove Dish from Catalog"
          description="Are you sure you want to remove this dish? It will no longer be available for upcoming daily menus."
          confirmText="Remove Dish"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteMealId)}
        />
      )}
    </div>
  );
};

