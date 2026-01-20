import { useEffect, useState } from 'react';
import { analytics, type UsageStats } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function Usage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await analytics.getUsage(days);
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
          <h1 className="text-2xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your skill usage and performance
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
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.totalExecutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.summary.successCount || 0} successful / {stats?.summary.errorCount || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summary.avgDurationMs || 0}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Used</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bySkill.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage by Skill */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Skill</CardTitle>
            <CardDescription>Most frequently used skills</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.bySkill.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No skill usage recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.bySkill.slice(0, 5).map((skill) => (
                  <div key={skill.skillSlug} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.skillName}</span>
                    </div>
                    <Badge variant="secondary">{skill.count} calls</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Usage Chart (simple text version) */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Skill executions over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.daily.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No activity recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.daily.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">{day.date}</span>
                    <div className="flex-1 bg-muted rounded h-4 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded"
                        style={{
                          width: `${Math.min(100, (day.count / Math.max(...stats.daily.map((d) => d.count))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest skill executions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentLogs?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {stats?.recentLogs?.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <span className="font-medium">{log.skillName}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                    {log.durationMs && (
                      <p className="text-xs text-muted-foreground mt-1">{log.durationMs}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
