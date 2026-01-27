/**
 * PayIntentionDialog - Prompts user to add payment method for premium features
 *
 * When users try to access premium integrations, this dialog explains
 * the upgrade and redirects to Stripe Checkout ($0 setup mode).
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { PayIntentionTrigger } from '@skillomatic/shared';

const API_BASE = import.meta.env.VITE_API_URL;

interface PayIntentionDialogProps {
  open: boolean;
  onClose: () => void;
  triggerType: PayIntentionTrigger;
  triggerProvider?: string;
  providerName?: string;
}

export function PayIntentionDialog({
  open,
  onClose,
  triggerType,
  triggerProvider,
  providerName,
}: PayIntentionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/pay-intentions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          triggerType,
          triggerProvider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to confirm subscription');
      }

      // Pay intention confirmed - show toast and close
      if (data.data?.confirmed) {
        const message = data.data.message || 'Thanks for your interest! This feature is coming soon.';
        toast(message, 'success');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const featureName = providerName || (triggerType === 'individual_ats' ? 'ATS integrations' : 'premium integrations');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription>
            Get access to {featureName} by adding a payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
              <Check className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">No charge today</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  We just need a payment method on file for future billing
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure checkout powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Cancel anytime, no commitment</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              'Continue to Checkout'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
