/**
 * Public Status Page
 *
 * Displays system health status. No authentication required.
 * Auto-refreshes every 60 seconds.
 *
 * To extend this page:
 * 1. Add more services to the status API response
 * 2. Add incident history section (requires incidents table)
 * 3. Add uptime percentage display (requires metrics history)
 *
 * @see apps/api/src/routes/status.ts for the API endpoint
 * @see docs/ADMIN_HEALTH_DASHBOARD.md for planned enhancements
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface StatusResponse {
  status: ServiceStatus;
  updatedAt: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    mcp: ServiceStatus;
    integrations: ServiceStatus;
  };
  deploy: {
    gitHash: string;
    timestamp: string | null;
  };
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'outage':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const colors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    outage: 'bg-red-100 text-red-800',
  };

  const labels = {
    operational: 'Operational',
    degraded: 'Degraded',
    outage: 'Outage',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatDeployTime(timestamp: string | null, gitHash: string): string {
  if (!timestamp) {
    return `(${gitHash.slice(0, 7)})`;
  }

  const date = new Date(timestamp);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatted} (${gitHash.slice(0, 7)}) (${formatTimeAgo(timestamp)})`;
}

export default function Status() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data);
      setError(null);
      setLastFetch(new Date());
    } catch (err) {
      setError('Unable to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const overallStatusText = {
    operational: 'All Systems Operational',
    degraded: 'Some Systems Degraded',
    outage: 'System Outage',
  };

  const overallStatusColor = {
    operational: 'text-green-600',
    degraded: 'text-yellow-600',
    outage: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link to="/" className="text-xl font-semibold text-slate-900 hover:text-slate-700">
            Skillomatic
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">System Status</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto" />
            <p className="mt-4 text-slate-500">Loading status...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="mt-4 text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchStatus}
              className="mt-4 px-4 py-2 bg-slate-100 rounded-md text-slate-700 hover:bg-slate-200"
            >
              Retry
            </button>
          </div>
        ) : status ? (
          <>
            {/* Overall Status */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-center gap-3">
                <StatusIcon status={status.status} />
                <span className={`text-xl font-semibold ${overallStatusColor[status.status]}`}>
                  {overallStatusText[status.status]}
                </span>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow divide-y">
              <div className="p-4">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Services
                </h2>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="font-medium text-slate-900">API</span>
                <StatusBadge status={status.services.api} />
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="font-medium text-slate-900">Database</span>
                <StatusBadge status={status.services.database} />
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="font-medium text-slate-900">MCP Server</span>
                <StatusBadge status={status.services.mcp} />
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="font-medium text-slate-900">Integrations</span>
                <StatusBadge status={status.services.integrations} />
              </div>
            </div>

            {/* Deploy Info */}
            <div className="mt-6 text-center text-sm text-slate-500">
              <p>Last deploy: {formatDeployTime(status.deploy.timestamp, status.deploy.gitHash)}</p>
              {lastFetch && (
                <p className="mt-1">
                  Status checked: {formatTimeAgo(lastFetch.toISOString())}
                  <button
                    onClick={fetchStatus}
                    className="ml-2 text-slate-400 hover:text-slate-600"
                    title="Refresh"
                  >
                    <RefreshCw className="h-3 w-3 inline" />
                  </button>
                </p>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillomatic</p>
        <Link to="/" className="hover:text-slate-700">
          Back to Skillomatic
        </Link>
      </footer>
    </div>
  );
}
