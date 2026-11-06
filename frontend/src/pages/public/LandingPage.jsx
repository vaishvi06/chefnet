import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  CalendarDays,
  QrCode,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  MapPin,
  Sparkles,
  Users,
  Clock,
  Leaf
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export const LandingPage = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 bg-radial-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge variant="primary" size="lg" className="mb-6 shadow-xs">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-saffron-500" />
              100% Hyperlocal • Zero Delivery Markup • Self-Pickup
            </span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-neutral-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Homemade meals from kitchens{' '}
            <span className="text-primary-700 underline decoration-saffron-400 decoration-wavy decoration-2">
              within 1 km.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Subscribe directly to verified neighbourhood home chefs. Enjoy authentic regional Gujarati, Punjabi, South Indian, and healthy diet meals collected freshly from a home kitchen down your lane.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=customer">
              <Button size="lg" variant="primary" className="shadow-warm text-base px-7">
                <span>Find Food Near Me</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/register?role=chef">
              <Button size="lg" variant="secondary" className="text-base px-7">
                <span>Become a Home Chef</span>
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>Strict 1 km Pickup Radius</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-saffron-600" />
              <span>Admin Verified Home Kitchens</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-primary-600" />
              <span>Offline Direct Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in 4 Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="saffron" size="sm" className="mb-2">
            Simple Process
          </Badge>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">
            How ChiefNet Works
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Four transparent steps to pure homemade tiffins every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Find a Home Chef',
              desc: 'Browse approved home kitchens within walking distance (< 1 km). Check culinary specialities, hygiene trust scores, and reviews.',
              icon: Compass,
              color: 'bg-primary-50 text-primary-700'
            },
            {
              step: '02',
              title: 'Subscribe to a Plan',
              desc: 'Choose a weekly or monthly subscription for breakfast, lunch, or dinner. Arrange payment directly with the chef once approved.',
              icon: CalendarDays,
              color: 'bg-saffron-50 text-saffron-700'
            },
            {
              step: '03',
              title: 'Reserve Daily Meals',
              desc: 'Pick your favourite dish from the chef’s daily menu before the cutoff window (e.g. 10:00 AM for lunch). Freshly prepared in home quantities.',
              icon: Clock,
              color: 'bg-blue-50 text-blue-700'
            },
            {
              step: '04',
              title: 'Scan QR & Pick Up',
              desc: 'Walk over to the kitchen during the pickup window, flash your high-contrast QR pass, collect your warm tiffin box, and enjoy!',
              icon: QrCode,
              color: 'bg-emerald-50 text-emerald-700'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} className="relative p-6 border-cream-200 hover:border-primary-300 transition-all">
                <span className="text-xs font-mono font-bold text-neutral-400 block mb-3">
                  STEP {item.step}
                </span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Split (Customers & Chefs) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customers Benefit Card */}
          <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white rounded-3xl p-8 sm:p-10 shadow-warm-lg">
            <Badge variant="saffron" size="sm" className="mb-4">
              For Subscribers
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-4">
              Real Food Like Maa Makes. Zero Restaurant Grease.
            </h3>
            <ul className="space-y-3.5 text-sm text-primary-100">
              <li className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-saffron-400 shrink-0 mt-0.5" />
                <span>Cooked in domestic home kitchens using cold-pressed oils, fresh regional spices, and pure love.</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-saffron-400 shrink-0 mt-0.5" />
                <span>Never wait on cold food in bike traffic. Your kitchen is under a 5 to 10-minute walk.</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-saffron-400 shrink-0 mt-0.5" />
                <span>Fair pricing starting as low as ₹70/thali because there are no 30% delivery app commissions.</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link to="/register?role=customer">
                <Button variant="secondary" size="md">
                  Browse Neighbourhood Kitchens
                </Button>
              </Link>
            </div>
          </div>

          {/* Chefs Benefit Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-cream-300 shadow-warm">
            <Badge variant="primary" size="sm" className="mb-4">
              For Home Chefs
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mb-4">
              Turn Your Cooking Skill into a Predictable Income.
            </h3>
            <ul className="space-y-3.5 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>Guaranteed subscribers: know exactly how many rotis and sabzis to prepare every morning.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>You set your own daily capacity (e.g. 15-20 subscribers) to maintain high cooking quality.</span>
              </li>
              <li className="flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>No delivery logistics: customers collect directly from your door with one tap QR scans.</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link to="/register?role=chef">
                <Button variant="primary" size="md">
                  Register Your Kitchen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Locality Showcase Callout */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-cream-100 border border-cream-300">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
            Live in Bellandur & HSR Layout Sector 2
          </h3>
          <p className="text-sm text-neutral-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Over 6 verified home kitchens offering authentic Gujarati thalis, Punjabi dal makhani, pure Jain meals, and high-protein diet bowls.
          </p>
          <Link to="/register?role=customer">
            <Button size="lg" variant="primary">
              Join Your Neighbourhood Table
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

