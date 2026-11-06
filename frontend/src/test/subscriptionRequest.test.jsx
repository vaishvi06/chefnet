import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

describe('Subscription Request Flow Component', () => {
  const PLAN_TYPES = [
    { value: 'weekly', label: 'Weekly Plan (7 Days)' },
    { value: 'monthly', label: 'Monthly Plan (30 Days)' }
  ];

  const MEAL_PLANS = [
    { value: 'lunch', label: 'Lunch Only (12:00 - 14:00)' },
    { value: 'dinner', label: 'Dinner Only (19:30 - 21:30)' },
    { value: 'full_day', label: 'Full Day (Lunch + Dinner)' }
  ];

  const SubscriptionRequestForm = ({ onSubmit }) => {
    const [planType, setPlanType] = React.useState('weekly');
    const [mealPlan, setMealPlan] = React.useState('lunch');
    const [notes, setNotes] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ planType, mealPlan, notes });
    };

    return (
      <form onSubmit={handleSubmit} data-testid="subscription-form" className="space-y-4">
        <Select
          label="Plan Duration"
          name="planType"
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
          options={PLAN_TYPES}
        />

        <Select
          label="Meal Coverage"
          name="mealPlan"
          value={mealPlan}
          onChange={(e) => setMealPlan(e.target.value)}
          options={MEAL_PLANS}
        />

        <div className="offline-notice">
          <p>ChiefNet has no online payment gateway. Settle payments offline directly with the home chef.</p>
        </div>

        <div>
          <label htmlFor="notes">Dietary Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Less spicy please..."
          />
        </div>

        <Button type="submit" variant="primary">
          Send Subscription Request
        </Button>
      </form>
    );
  };

  it('renders plan options and offline payment reminder', () => {
    render(<SubscriptionRequestForm onSubmit={() => {}} />);

    expect(screen.getByText('Plan Duration')).toBeInTheDocument();
    expect(screen.getByText('Meal Coverage')).toBeInTheDocument();
    expect(
      screen.getByText(/ChiefNet has no online payment gateway/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Send Subscription Request')).toBeInTheDocument();
  });

  it('submits form with chosen plan type, meal plan, and notes', () => {
    const handleSubmit = vi.fn();
    render(<SubscriptionRequestForm onSubmit={handleSubmit} />);

    // Change plan to monthly
    fireEvent.change(screen.getByRole('combobox', { name: /Plan Duration/i }), {
      target: { value: 'monthly' }
    });

    // Change meal plan to full_day
    fireEvent.change(screen.getByRole('combobox', { name: /Meal Coverage/i }), {
      target: { value: 'full_day' }
    });

    // Enter notes
    fireEvent.change(screen.getByPlaceholderText('Less spicy please...'), {
      target: { value: 'Low oil and mild spice' }
    });

    // Submit form
    fireEvent.submit(screen.getByTestId('subscription-form'));

    expect(handleSubmit).toHaveBeenCalledWith({
      planType: 'monthly',
      mealPlan: 'full_day',
      notes: 'Low oil and mild spice'
    });
  });
});

