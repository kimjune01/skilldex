/**
 * Admin Billing Page
 *
 * Shows pay intention tracking for superadmins.
 * Displays users who have expressed willingness to pay for premium features.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CreditCard, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import type { PayIntentionStats } from '@skillomatic/shared';

export default function AdminBilling() {
  const [stats, setStats] = useState<PayIntentionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pay-intentions/admin/stats?days=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load billing stats');
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'individual_ats':
        return 'ATS Access';
      case 'premium_integration':
        return 'Premium Integration';
      case 'subscription':
        return 'Subscription';
      case 'automation':
        return 'Automation';
      default:
        return triggerType;
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading billing data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">
        {error}
        <Button variant="link" onClick={loadStats}>
          Retry
        </Button>
      </div>
    );
  }

  const conversionRate = stats?.total ? ((stats.confirmed / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Pay Intentions</h1>
          <p className="text-muted-foreground mt-1">
            Track users who have expressed intent to pay for premium features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Intentions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users who attempted premium features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Added payment method
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Started but didn't complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Checkout completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By Trigger Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Trigger Type</CardTitle>
            <CardDescription>What features triggered pay intentions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Individual ATS Access</span>
                <Badge variant="secondary">{stats?.byTriggerType.individual_ats || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Premium Integrations</span>
                <Badge variant="secondary">{stats?.byTriggerType.premium_integration || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Willingness to pay signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Users with payment method</span>
                <Badge className="bg-green-100 text-green-800">{stats?.confirmed || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Potential revenue</span>
                <Badge variant="outline">${((stats?.confirmed || 0) * 49).toLocaleString()}/mo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Intentions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pay Intentions</CardTitle>
          <CardDescription>Users who have expressed intent to pay</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentIntentions && stats.recentIntentions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentIntentions.map((intention) => (
                <div
                  key={intention.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{intention.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{intention.user?.email || 'No email'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(intention.createdAt)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      variant={intention.status === 'confirmed' ? 'default' : 'secondary'}
                      className={intention.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {intention.status === 'confirmed' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {getTriggerLabel(intention.triggerType)}
                      {intention.triggerProvider && (
                        <span className="ml-1">({intention.triggerProvider})</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pay intentions yet</p>
              <p className="text-sm">
                When users try to access premium features, their intent will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
