/**
 * Admin Chat Page
 *
 * Chat interface for admins with meta-skills for creating and managing skills.
 * Reuses the core chat components but with admin-specific capabilities.
 */
import { useState, useCallback } from 'react';
import { MessageList, ChatInput } from '@/components/chat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wand2, Download, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@skillomatic/shared';

// Meta-skill suggestions for admins
const META_SKILL_SUGGESTIONS = [
  'Create a new skill for sourcing candidates on LinkedIn',
  'Help me write a skill that syncs data between ATS systems',
  'Generate a skill template for email outreach automation',
  'Create a skill that extracts job requirements from descriptions',
];

export default function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(
    async (content: string) => {
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      // Create placeholder for assistant message
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // For now, simulate a response (in production, this would call an admin chat endpoint)
        // TODO: Implement actual admin chat API endpoint with:
        // - messageHistory for context
        // - systemContext for skill creation guidance
        const simulatedResponse = generateMetaResponse(content);

        // Simulate streaming
        for (let i = 0; i < simulatedResponse.length; i += 3) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const chunk = simulatedResponse.slice(i, i + 3);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages]
  );

  const handleDownloadChat = useCallback(() => {
    if (messages.length === 0) return;

    const lines = messages.map((m) => {
      const timestamp = new Date(m.timestamp).toLocaleString();
      const role = m.role === 'user' ? 'You' : 'Assistant';
      return `[${timestamp}] ${role}:\n${m.content}\n`;
    });

    const content = lines.join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Admin Chat</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
              <Wand2 className="h-3 w-3 mr-1" />
              Meta-Skills
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Create and manage skills with AI assistance
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownloadChat}
          disabled={messages.length === 0}
          title="Download chat"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Empty state with suggestions */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Skill Creation Assistant</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            I can help you create new skills, generate configurations, and design automation workflows.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
            {META_SKILL_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-4 text-left rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <p className="text-sm">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <MessageList
          messages={messages}
          onRunSkill={() => {}}
          onShowInstructions={() => {}}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        placeholder="Describe the skill you want to create..."
      />
    </div>
  );
}

/**
 * Generate a simulated meta-skill response
 * TODO: Replace with actual admin chat API endpoint
 */
function generateMetaResponse(input: string): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('linkedin') && lowerInput.includes('sourcing')) {
    return `I'll help you create a LinkedIn sourcing skill. Here's a complete configuration:

\`\`\`yaml
name: LinkedIn Candidate Search
slug: linkedin-candidate-search
description: Search and extract candidate profiles from LinkedIn based on criteria
category: sourcing
version: 1.0.0
requiredIntegrations:
  - linkedin
requiredScopes:
  - linkedin:read_profile
  - linkedin:search
intent: Find and extract candidate information from LinkedIn searches
capabilities:
  - Search LinkedIn by job title, location, and keywords
  - Extract profile information (name, headline, experience)
  - Save candidates to your ATS
  - Track sourcing activity
\`\`\`

This skill requires the browser extension to be installed since it uses your LinkedIn session. Would you like me to:

1. Add more capabilities?
2. Generate the full skill implementation?
3. Create a related skill for outreach?`;
  }

  if (lowerInput.includes('ats') && lowerInput.includes('sync')) {
    return `Here's a skill configuration for ATS data synchronization:

\`\`\`yaml
name: ATS Data Sync
slug: ats-data-sync
description: Synchronize candidate and job data between ATS systems
category: ats
version: 1.0.0
requiredIntegrations:
  - ats
requiredScopes:
  - ats:read_candidates
  - ats:write_candidates
  - ats:read_jobs
intent: Keep candidate data synchronized across recruiting tools
capabilities:
  - Sync candidate profiles between systems
  - Update application statuses
  - Merge duplicate records
  - Export data to CSV
\`\`\`

Should I expand on any of these capabilities or add error handling logic?`;
  }

  if (lowerInput.includes('email') && lowerInput.includes('outreach')) {
    return `Here's a skill template for email outreach automation:

\`\`\`yaml
name: Email Outreach Campaign
slug: email-outreach
description: Send personalized outreach emails to candidates
category: communication
version: 1.0.0
requiredIntegrations:
  - email
requiredScopes:
  - email:send
  - email:read
intent: Automate personalized candidate outreach at scale
capabilities:
  - Generate personalized email content
  - Schedule email sequences
  - Track opens and responses
  - A/B test subject lines
\`\`\`

This skill works with Gmail and Outlook integrations. Want me to add template examples or sequence logic?`;
  }

  return `I can help you create that skill! To generate a complete configuration, please tell me:

1. **Purpose**: What problem does this skill solve?
2. **Integrations**: Which services does it need to connect to?
3. **Actions**: What specific actions should it perform?
4. **Inputs**: What information does the user provide?
5. **Outputs**: What results should it return?

Once you provide these details, I'll generate a complete skill configuration with:
- YAML metadata
- Required scopes and permissions
- Capability definitions
- Implementation guidance`;
}
