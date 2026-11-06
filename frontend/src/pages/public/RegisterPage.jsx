import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, ChefHat, Utensils, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordErrorMsg =
  'Password must be at least 8 characters long and contain at least one letter and one number';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().regex(passwordPattern, passwordErrorMsg),
    confirmPassword: z.string(),
    role: z.enum(['customer', 'chef']),
    kitchenName: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'chef' ? 'chef' : 'customer';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: initialRole,
      kitchenName: ''
    }
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        kitchenName: data.role === 'chef' ? data.kitchenName : undefined
      });

      toast.success('Registration successful! Please verify your email.');
      if (data.role === 'chef') {
        navigate('/chef/onboarding');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 py-8">
      <Card className="max-w-md w-full p-6 sm:p-8 shadow-warm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center mx-auto mb-3">
            <Utensils className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900">
            Join ChiefNet
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Choose your role to get started with neighbourhood homemade food
          </p>
        </div>

        {/* Role Chooser Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleChange('customer')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              selectedRole === 'customer'
                ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                : 'border-cream-300 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2 ${
              selectedRole === 'customer' ? 'bg-primary-600 text-white' : 'bg-cream-100 text-neutral-600'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-900">Customer</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Subscribe & Pick Up</p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('chef')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              selectedRole === 'chef'
                ? 'border-saffron-600 bg-saffron-50/60 ring-2 ring-saffron-500/20'
                : 'border-cream-300 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2 ${
              selectedRole === 'chef' ? 'bg-saffron-600 text-white' : 'bg-cream-100 text-neutral-600'
            }`}>
              <ChefHat className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-900">Home Chef</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Cook & Earn</p>
          </button>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder={selectedRole === 'chef' ? 'e.g. Smt. Shanti Devi' : 'e.g. Rohan Sharma'}
            icon={User}
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="you@domain.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          {selectedRole === 'chef' && (
            <Input
              label="Kitchen / Brand Name"
              placeholder="e.g. Shanti's Traditional Gujarati Rasoi"
              icon={ChefHat}
              helperText="You can also adjust this later during kitchen onboarding."
              error={errors.kitchenName?.message}
              {...register('kitchenName')}
            />
          )}

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Min. 8 chars, 1 letter, 1 number"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Repeat password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant={selectedRole === 'chef' ? 'secondary' : 'primary'}
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              {selectedRole === 'chef' ? 'Register Kitchen' : 'Create Customer Account'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-500 border-t border-cream-200 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-700 hover:underline">
            Sign in here
          </Link>
        </div>
      </Card>
    </div>
  );
};

