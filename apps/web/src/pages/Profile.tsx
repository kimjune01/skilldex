/**
 * Profile Page
 *
 * Displays user profile information from the database.
 * Shows basic user info, organization details, and account stats.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiKeys, integrations, analytics, type UsageStats } from '../lib/api';
import type { ApiKeyPublic, IntegrationPublic } from '@skillomatic/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Calendar, Key, Plug, BarChart3, Crown, Shield } from 'lucide-react';

export default function Profile() {
  const { user, isAdmin, isSuperAdmin, isIndividual, organizationName } = useAuth();
  const [apiKeyCount, setApiKeyCount] = useState<number>(0);
  const [integrationCount, setIntegrationCount] = useState<number>(0);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiKeys.list().catch(() => [] as ApiKeyPublic[]),
      integrations.list().catch(() => [] as IntegrationPublic[]),
      analytics.getUsage(30).catch(() => null),
    ])
      .then(([keys, ints, stats]) => {
        setApiKeyCount(keys.length);
        setIntegrationCount(ints.filter((i) => i.status === 'connected').length);
        setUsageStats(stats);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(220_30%_20%)]">Profile</h1>
        <p className="text-[hsl(220_15%_50%)] mt-1">
          Your account information and activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card className="robot-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[hsl(220_70%_50%)]" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl robot-button flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold text-[hsl(220_30%_20%)]">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isSuperAdmin ? (
                    <Badge className="text-xs bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 font-bold">
                      <Crown className="h-3 w-3 mr-1" />
                      Super Admin
                    </Badge>
                  ) : isAdmin ? (
                    <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-bold">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-[hsl(220_15%_50%)]" />
                <span className="text-[hsl(220_15%_50%)]">Email:</span>
                <span className="font-medium text-[hsl(220_30%_20%)] font-mono text-xs">
                  {user?.email}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-[hsl(220_15%_50%)]" />
                <span className="text-[hsl(220_15%_50%)]">Account Type:</span>
                <span className="font-medium text-[hsl(220_30%_20%)]">
                  {isIndividual ? 'Individual' : organizationName || 'Organization'}
                </span>
              </div>

              {user?.id && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[hsl(220_15%_50%)]" />
                  <span className="text-[hsl(220_15%_50%)]">User ID:</span>
                  <span className="font-mono text-xs text-[hsl(220_15%_50%)] truncate max-w-[200px]">
                    {user.id}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="robot-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-[hsl(220_70%_50%)]" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[hsl(220_15%_92%)] rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220_15%_95%)] border-2 border-[hsl(220_15%_88%)]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-[hsl(220_15%_85%)] flex items-center justify-center">
                      <Key className="h-4 w-4 text-[hsl(220_30%_40%)]" />
                    </div>
                    <span className="font-medium text-[hsl(220_30%_20%)]">API Keys</span>
                  </div>
                  <span className="text-xl font-bold text-[hsl(220_70%_50%)]">
                    {apiKeyCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220_15%_95%)] border-2 border-[hsl(220_15%_88%)]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-[hsl(220_15%_85%)] flex items-center justify-center">
                      <Plug className="h-4 w-4 text-[hsl(220_30%_40%)]" />
                    </div>
                    <span className="font-medium text-[hsl(220_30%_20%)]">Connections</span>
                  </div>
                  <span className="text-xl font-bold text-[hsl(220_70%_50%)]">
                    {integrationCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220_15%_95%)] border-2 border-[hsl(220_15%_88%)]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-[hsl(220_15%_85%)] flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-[hsl(220_30%_40%)]" />
                    </div>
                    <span className="font-medium text-[hsl(220_30%_20%)]">
                      Skills Used (30d)
                    </span>
                  </div>
                  <span className="text-xl font-bold text-[hsl(220_70%_50%)]">
                    {usageStats?.summary?.totalExecutions ?? 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organization Card (if in org) */}
      {organizationName && (
        <Card className="robot-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-[hsl(220_70%_50%)]" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="robot-display rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-cyan-400">
                    {organizationName}
                  </p>
                  <p className="text-xs font-mono text-cyan-400/60">
                    {user?.organizationId}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
