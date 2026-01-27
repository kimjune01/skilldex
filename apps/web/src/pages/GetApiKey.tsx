import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ArrowRight } from 'lucide-react';

const providers = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Best for complex tasks and reasoning',
    url: 'https://console.anthropic.com/settings/keys',
    badge: 'Recommended',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4)',
    description: 'Great all-around performance',
    url: 'https://platform.openai.com/api-keys',
    badge: null,
    color: '',
  },
  {
    id: 'google',
    name: 'Google (Gemini)',
    description: 'Good for general tasks',
    url: 'https://aistudio.google.com/app/apikey',
    badge: null,
    color: '',
  },
];

export default function GetApiKey() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Get an AI API Key</h1>
        <p className="text-muted-foreground mt-1">
          To use Skillomatic, you'll need an API key from an AI provider. This lets you use your own account and only pay for what you use.
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.badge ? 'border-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                {provider.badge && (
                  <Badge className={provider.color}>{provider.badge}</Badge>
                )}
              </div>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={provider.badge ? 'default' : 'outline'}
                className="w-full"
                onClick={() => window.open(provider.url, '_blank')}
              >
                Get API Key
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">After you get your API key:</p>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>Copy the API key from your provider's dashboard</li>
          <li>Open Claude Desktop (or your preferred AI chat app)</li>
          <li>Paste the key in the settings</li>
        </ol>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" asChild>
          <Link to="/home">
            Skip for now
          </Link>
        </Button>
        <Button asChild>
          <Link to="/desktop-chat">
            I have my API key
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
