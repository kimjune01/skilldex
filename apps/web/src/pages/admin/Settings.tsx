import { useEffect, useState } from 'react';
import { settings as settingsApi, type LLMSettings, type LLMProvider } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Cpu,
  Key,
} from 'lucide-react';

export default function AdminSettings() {
  const [llmSettings, setLLMSettings] = useState<LLMSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for adding API keys
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = () => {
    setIsLoading(true);
    setError('');
    settingsApi
      .getLLM()
      .then(setLLMSettings)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveKey = async (providerId: string) => {
    if (!apiKeyInput.trim()) {
      setError('API key is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await settingsApi.setProviderKey(providerId, apiKeyInput);
      setSuccess(`${providerId} API key saved successfully`);
      setEditingProvider(null);
      setApiKeyInput('');
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (providerId: string) => {
    if (!confirm(`Remove ${providerId} API key?`)) return;

    setIsSaving(true);
    setError('');

    try {
      await settingsApi.deleteProviderKey(providerId);
      setSuccess(`${providerId} API key removed`);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (provider: string, model: string) => {
    setError('');
    setSuccess('');

    try {
      await settingsApi.setDefault(provider, model);
      setSuccess(`Default set to ${provider} / ${model}`);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading settings...
      </div>
    );
  }

  const configuredProviders = llmSettings?.providers.filter((p) => p.configured) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure LLM providers and system settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Default Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Default LLM
          </CardTitle>
          <CardDescription>
            Select the default model for chat and skill execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configuredProviders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Configure at least one provider below to enable LLM features.
            </p>
          ) : (
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Provider</Label>
                <Select
                  value={llmSettings?.defaultProvider}
                  onValueChange={(provider: string) => {
                    const p = llmSettings?.providers.find((pr) => pr.id === provider);
                    if (p) {
                      handleSetDefault(provider, p.defaultModel);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuredProviders.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Model</Label>
                <Select
                  value={llmSettings?.defaultModel}
                  onValueChange={(model: string) => {
                    if (llmSettings?.defaultProvider) {
                      handleSetDefault(llmSettings.defaultProvider, model);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmSettings?.providers
                      .find((p) => p.id === llmSettings.defaultProvider)
                      ?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            LLM Provider API Keys
          </CardTitle>
          <CardDescription>
            Add API keys for the LLM providers you want to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {llmSettings?.providers.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              isEditing={editingProvider === provider.id}
              apiKeyInput={apiKeyInput}
              showApiKey={showApiKey}
              isSaving={isSaving}
              onEdit={() => {
                setEditingProvider(provider.id);
                setApiKeyInput('');
                setShowApiKey(false);
              }}
              onCancel={() => {
                setEditingProvider(null);
                setApiKeyInput('');
              }}
              onSave={() => handleSaveKey(provider.id)}
              onDelete={() => handleDeleteKey(provider.id)}
              onApiKeyChange={setApiKeyInput}
              onToggleShow={() => setShowApiKey(!showApiKey)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface ProviderRowProps {
  provider: LLMProvider;
  isEditing: boolean;
  apiKeyInput: string;
  showApiKey: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onApiKeyChange: (value: string) => void;
  onToggleShow: () => void;
}

function ProviderRow({
  provider,
  isEditing,
  apiKeyInput,
  showApiKey,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onApiKeyChange,
  onToggleShow,
}: ProviderRowProps) {
  const getPlaceholder = () => {
    switch (provider.id) {
      case 'groq':
        return 'gsk_...';
      case 'anthropic':
        return 'sk-ant-...';
      case 'openai':
        return 'sk-...';
      default:
        return 'API key';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-24 font-medium">{provider.name}</div>
        {provider.configured ? (
          <Badge variant="success" className="gap-1">
            <Check className="h-3 w-3" />
            Configured
          </Badge>
        ) : (
          <Badge variant="secondary">Not configured</Badge>
        )}
        {provider.apiKeyPreview && (
          <span className="text-xs text-muted-foreground font-mono">
            {provider.apiKeyPreview}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-64 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onEdit}>
              {provider.configured ? 'Update' : 'Add Key'}
            </Button>
            {provider.configured && (
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
