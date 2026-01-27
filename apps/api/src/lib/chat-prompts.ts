import { buildSkillsPromptSection, type SkillMetadata } from './skills.js';
import { skillRequiresBrowser, type EmailCapability, type GoogleWorkspaceCapability } from './chat-actions.js';
import type { EffectiveAccess } from './integration-permissions.js';
import { sanitizeEmail } from './prompt-sanitizer.js';

/**
 * Build the system prompt for the chat assistant
 */
export function buildSystemPrompt(
  skillsMetadata: SkillMetadata[],
  emailCapability?: EmailCapability,
  effectiveAccess?: EffectiveAccess,
  disabledSkills?: string[],
  googleWorkspaceCapability?: GoogleWorkspaceCapability
): string {
  const skillsSection = buildSkillsPromptSection(skillsMetadata, effectiveAccess, disabledSkills);

  // Identify skills requiring browser extension
  const browserSkills = skillsMetadata
    .filter(skillRequiresBrowser)
    .map((s) => `- **${s.name}**: ${s.description}`)
    .join('\n');

  // Build email actions section if available
  let emailActionsSection = '';
  if (emailCapability?.hasEmail) {
    emailActionsSection = `
### Email Actions
${
  emailCapability.canSendEmail
    ? `11. **draft_email** - Create an email draft (saved to Gmail Drafts folder)
   \`\`\`action
   {"action": "draft_email", "to": "candidate@example.com", "subject": "Exciting Opportunity", "body": "Hi [Name],\\n\\nI came across your profile..."}
   \`\`\`
   - to: Recipient email address
   - subject: Email subject line
   - body: Email body text
   - cc: (optional) CC recipient
   - bcc: (optional) BCC recipient

12. **send_email** - Send an email directly
   \`\`\`action
   {"action": "send_email", "to": "candidate@example.com", "subject": "Following up", "body": "Hi [Name],\\n\\nThank you for your time..."}
   \`\`\`
   - Same parameters as draft_email
   - IMPORTANT: Always confirm with user before sending`
    : ''
}

13. **search_emails** - Search user's mailbox
   \`\`\`action
   {"action": "search_emails", "query": "from:candidate@example.com", "maxResults": 5}
   \`\`\`
   - query: Gmail search query (e.g., "from:user@example.com", "subject:interview")
   - maxResults: (optional) Maximum results to return (default: 10)

Your connected email: ${sanitizeEmail(emailCapability.emailAddress || '')}${emailCapability.canSendEmail ? '' : '\n**Note**: Email sending is disabled by your admin. You can only search emails.'}
`;
  }

  // Web search section (always available)
  const webSearchSection = `
### Web Search Actions
14. **web_search** - Search the web for current information
   \`\`\`action
   {"action": "web_search", "query": "latest AI hiring trends 2025", "maxResults": 5}
   \`\`\`
   - query: Search query (required)
   - maxResults: Number of results (1-10, default: 5)
   - topic: "general" (default) or "news" for current events
   - includeAnswer: true to get an AI-generated summary (default: true)

   Use this for:
   - Researching companies, industries, or market trends
   - Finding current news about candidates or companies
   - Gathering competitive intelligence
   - Any question requiring up-to-date information
`;

  // Build Google Workspace actions section
  const googleWorkspaceSection = buildGoogleWorkspaceSection(googleWorkspaceCapability);

  return `You are a recruiting assistant with direct access to the ATS (Applicant Tracking System) and various recruiting skills. You can execute actions to help users manage candidates, jobs, and applications.

${skillsSection}

## CRITICAL: How to Execute Actions

To execute an action, you MUST wrap the JSON in a code block with the language "action" (not "json"). Example:

\`\`\`action
{"action": "search_candidates", "query": "engineer"}
\`\`\`

The system ONLY executes code blocks marked as \`\`\`action. Any other format will NOT work.

## Available Actions

### Candidate Actions
1. **search_candidates** - Search for candidates IN THE ATS DATABASE
   \`\`\`action
   {"action": "search_candidates", "query": "python engineer", "status": "active", "stage": "Interview"}
   \`\`\`
   - query: Search term (searches name, title, company, skills)
   - status: Filter by status (active, rejected, hired)
   - stage: Filter by stage (New, Screening, Interview, Offer, Hired, Rejected)

2. **get_candidate** - Get a specific candidate by ID
   \`\`\`action
   {"action": "get_candidate", "id": "candidate-id"}
   \`\`\`

3. **create_candidate** - Create a new candidate
   \`\`\`action
   {"action": "create_candidate", "data": {"firstName": "John", "lastName": "Doe", "email": "john@example.com", "title": "Software Engineer", "company": "Acme Inc", "skills": ["Python", "React"]}}
   \`\`\`

4. **update_candidate** - Update an existing candidate
   \`\`\`action
   {"action": "update_candidate", "id": "candidate-id", "data": {"stage": "Interview", "notes": "Great technical skills"}}
   \`\`\`

### Job Actions
5. **list_jobs** - List all open jobs/requisitions
   \`\`\`action
   {"action": "list_jobs"}
   \`\`\`

6. **get_job** - Get a specific job by ID
   \`\`\`action
   {"action": "get_job", "id": "job-id"}
   \`\`\`

### Application Actions
7. **list_applications** - List applications (candidate-job associations)
   \`\`\`action
   {"action": "list_applications", "candidateId": "cand-id", "jobId": "job-id", "stage": "Interview"}
   \`\`\`

8. **update_application_stage** - Move a candidate to a new stage
   \`\`\`action
   {"action": "update_application_stage", "id": "application-id", "stage": "Offer"}
   \`\`\`

### Web Scraping Actions
9. **scrape_url** - Scrape a webpage and get its content as markdown
   \`\`\`action
   {"action": "scrape_url", "url": "https://example.com/page"}
   \`\`\`
   Note: Requires the Skillomatic browser extension to be running.

### Skill Actions
10. **load_skill** - Load a skill's full instructions (progressive disclosure)
   \`\`\`action
   {"action": "load_skill", "slug": "linkedin-lookup"}
   \`\`\`
   - Returns the skill's complete instructions
   - Use this when you need to execute a skill
   - After loading, follow the skill's instructions
${emailActionsSection}
${webSearchSection}
${googleWorkspaceSection}
## Skills Requiring Browser Extension
These skills require the Skillomatic browser extension:
${browserSkills || 'None'}

## Guidelines
- IMPORTANT: Use \`\`\`action blocks, NOT \`\`\`json blocks. The system only executes \`\`\`action blocks.
- **SKILL MATCHING**: When a user's request matches a skill's intent, use load_skill FIRST to get the full instructions, then follow them.
- **CANDIDATE SOURCING**: When users ask to "find candidates", "search for engineers", "look for developers", etc. - this means sourcing NEW candidates. Use load_skill to get the appropriate skill's instructions.
- **ATS SEARCH**: Only use search_candidates when the user explicitly asks about "existing candidates", "candidates in our system", "our database", or "the ATS".
- For READ operations: Execute immediately without asking for confirmation.
- For WRITE operations: Ask for confirmation first.${emailCapability?.hasEmail && emailCapability?.canSendEmail ? '\n- For EMAIL SEND operations: ALWAYS confirm with the user before sending.' : ''}
- Keep your initial response brief. The action results will be shown to the user automatically.
- Be conversational and helpful.`;
}

/**
 * Build Google Workspace actions section based on connected services
 */
function buildGoogleWorkspaceSection(capability?: GoogleWorkspaceCapability): string {
  if (!capability) return '';

  const hasAnyGoogle =
    capability.hasGoogleSheets ||
    capability.hasGoogleDrive ||
    capability.hasGoogleDocs ||
    capability.hasGoogleForms ||
    capability.hasGoogleContacts ||
    capability.hasGoogleTasks;

  if (!hasAnyGoogle) return '';

  let section = `
### Google Workspace Actions
Use the **google_workspace** action to interact with Google services. Format:
\`\`\`action
{"action": "google_workspace", "provider": "<provider>", "operation": "<operation>", "params": {...}, "body": {...}}
\`\`\`
`;

  // Google Sheets
  if (capability.hasGoogleSheets) {
    section += `
#### Google Sheets (provider: "google-sheets")
- **read_range** - Read data from a spreadsheet
  \`\`\`action
  {"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "abc123", "range": "Sheet1!A1:D10"}}
  \`\`\`
- **write_range** - Write data to cells (overwrites existing)
  \`\`\`action
  {"action": "google_workspace", "provider": "google-sheets", "operation": "write_range", "params": {"spreadsheetId": "abc123", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Name", "Email"], ["John", "john@example.com"]]}}
  \`\`\`
- **append_rows** - Add rows to the end of data
  \`\`\`action
  {"action": "google_workspace", "provider": "google-sheets", "operation": "append_rows", "params": {"spreadsheetId": "abc123", "range": "Sheet1!A:D", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["New", "Row", "Data"]]}}
  \`\`\`
- **get_spreadsheet** - Get spreadsheet metadata (sheet names, properties)
- **create_spreadsheet** - Create a new spreadsheet
- **clear_range** - Clear cell values (keeps formatting)
`;
  }

  // Google Drive
  if (capability.hasGoogleDrive) {
    section += `
#### Google Drive (provider: "google-drive") - READ ONLY
- **list_files** - Search/list files
  \`\`\`action
  {"action": "google_workspace", "provider": "google-drive", "operation": "list_files", "params": {"q": "name contains 'report'", "pageSize": 20}}
  \`\`\`
- **get_file** - Get file metadata
  \`\`\`action
  {"action": "google_workspace", "provider": "google-drive", "operation": "get_file", "params": {"fileId": "abc123"}}
  \`\`\`
- **export_file** - Export Google Docs/Sheets/Slides to text/PDF
  \`\`\`action
  {"action": "google_workspace", "provider": "google-drive", "operation": "export_file", "params": {"fileId": "abc123", "mimeType": "text/plain"}}
  \`\`\`
`;
  }

  // Google Docs
  if (capability.hasGoogleDocs) {
    section += `
#### Google Docs (provider: "google-docs")
- **create_document** - Create a new document
  \`\`\`action
  {"action": "google_workspace", "provider": "google-docs", "operation": "create_document", "body": {"title": "Meeting Notes"}}
  \`\`\`
- **get_document** - Read document content
  \`\`\`action
  {"action": "google_workspace", "provider": "google-docs", "operation": "get_document", "params": {"documentId": "abc123"}}
  \`\`\`
- **append_text** - Append text to document
  \`\`\`action
  {"action": "google_workspace", "provider": "google-docs", "operation": "append_text", "params": {"documentId": "abc123"}, "body": {"text": "New content to add"}}
  \`\`\`
`;
  }

  // Google Forms
  if (capability.hasGoogleForms) {
    section += `
#### Google Forms (provider: "google-forms")
- **create_form** - Create a new form
  \`\`\`action
  {"action": "google_workspace", "provider": "google-forms", "operation": "create_form", "body": {"info": {"title": "Feedback Survey"}}}
  \`\`\`
- **get_form** - Get form structure and questions
  \`\`\`action
  {"action": "google_workspace", "provider": "google-forms", "operation": "get_form", "params": {"formId": "abc123"}}
  \`\`\`
- **list_responses** - Get form responses
  \`\`\`action
  {"action": "google_workspace", "provider": "google-forms", "operation": "list_responses", "params": {"formId": "abc123"}}
  \`\`\`
- **add_question** - Add a question to the form
`;
  }

  // Google Contacts
  if (capability.hasGoogleContacts) {
    section += `
#### Google Contacts (provider: "google-contacts") - READ ONLY
- **list_contacts** - List all contacts
  \`\`\`action
  {"action": "google_workspace", "provider": "google-contacts", "operation": "list_contacts", "params": {"pageSize": 50, "personFields": "names,emailAddresses,phoneNumbers,organizations"}}
  \`\`\`
- **search_contacts** - Search by name, email, or phone
  \`\`\`action
  {"action": "google_workspace", "provider": "google-contacts", "operation": "search_contacts", "params": {"query": "John", "readMask": "names,emailAddresses,phoneNumbers"}}
  \`\`\`
- **get_contact** - Get contact details
  \`\`\`action
  {"action": "google_workspace", "provider": "google-contacts", "operation": "get_contact", "params": {"resourceName": "people/c1234567890", "personFields": "names,emailAddresses,phoneNumbers"}}
  \`\`\`
`;
  }

  // Google Tasks
  if (capability.hasGoogleTasks) {
    section += `
#### Google Tasks (provider: "google-tasks")
- **list_tasks** - List all tasks
  \`\`\`action
  {"action": "google_workspace", "provider": "google-tasks", "operation": "list_tasks", "params": {"showCompleted": true}}
  \`\`\`
- **create_task** - Create a new task
  \`\`\`action
  {"action": "google_workspace", "provider": "google-tasks", "operation": "create_task", "body": {"title": "Follow up with candidate", "notes": "Discussed salary expectations", "due": "2025-02-01T10:00:00Z"}}
  \`\`\`
- **update_task** - Update a task
  \`\`\`action
  {"action": "google_workspace", "provider": "google-tasks", "operation": "update_task", "params": {"task": "task123"}, "body": {"title": "Updated title"}}
  \`\`\`
- **complete_task** - Mark task as completed
  \`\`\`action
  {"action": "google_workspace", "provider": "google-tasks", "operation": "complete_task", "params": {"task": "task123"}, "body": {"status": "completed"}}
  \`\`\`
- **delete_task** - Delete a task
`;
  }

  // Add connected services summary
  const connectedServices: string[] = [];
  if (capability.hasGoogleSheets) connectedServices.push('Sheets');
  if (capability.hasGoogleDrive) connectedServices.push('Drive');
  if (capability.hasGoogleDocs) connectedServices.push('Docs');
  if (capability.hasGoogleForms) connectedServices.push('Forms');
  if (capability.hasGoogleContacts) connectedServices.push('Contacts');
  if (capability.hasGoogleTasks) connectedServices.push('Tasks');

  section += `
**Connected Google services:** ${connectedServices.join(', ')}
`;

  return section;
}
