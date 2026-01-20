import { useEffect, useState } from 'react';
import { analytics, type UsageStats } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, Users, Zap, AlertTriangle } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await analytics.getAdminStats(days);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading analytics...
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform-wide usage and performance
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.totalExecutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.uniqueUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.successRate || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.avgDurationMs || 0}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.summary.errorCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage by Skill */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Skill</CardTitle>
            <CardDescription>Platform-wide skill popularity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.bySkill.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No skill usage recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.bySkill.map((skill) => (
                  <div key={skill.skillSlug} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.skillName}</span>
                      {skill.category && (
                        <Badge variant="outline" className="text-xs">
                          {skill.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{skill.count} calls</Badge>
                      <span className="text-xs text-muted-foreground">
                        {skill.uniqueUsers} users
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
            <CardDescription>Most active skill users</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topUsers?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No users recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.topUsers?.map((user, idx) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-sm w-6">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-medium">{user.userName}</span>
                        <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                      </div>
                    </div>
                    <Badge>{user.count} executions</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Platform-wide usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.daily.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No activity recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {stats?.daily.map((day) => (
                <div key={day.date} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24">{day.date}</span>
                  <div className="flex-1 bg-muted rounded h-4 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded"
                      style={{
                        width: `${Math.min(100, (day.count / Math.max(...stats.daily.map((d) => d.count), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                  <span className="text-xs text-muted-foreground w-16">
                    {day.uniqueUsers} users
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {stats?.recentErrors && stats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Recent Errors</CardTitle>
            <CardDescription>Skill execution failures to investigate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentErrors.map((error, idx) => (
                <div key={idx} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{error.skillName}</span>
                    <Badge variant="destructive">{error.count} occurrences</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {error.errorMessage || 'Unknown error'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
