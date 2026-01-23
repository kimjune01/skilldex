# MCP Server Manual Tests

Manual tests to verify the Skillomatic MCP server works correctly in Claude Desktop.

## Prerequisites

1. API server running: `pnpm dev`
2. MCP server configured in Claude Desktop:
   ```json
   {
     "mcpServers": {
       "skillomatic": {
         "command": "node",
         "args": ["/path/to/skillomatic/packages/mcp/dist/index.js"],
         "env": {
           "SKILLOMATIC_API_KEY": "sk_test_demo_api_key",
           "SKILLOMATIC_API_URL": "http://localhost:3000"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop after config changes

---

## Test 1: Skill Catalog Discovery

**Prompt:**
> "I want to find candidates on LinkedIn for a backend engineer role"

**Expected behavior:**
1. Claude calls `get_skill_catalog` automatically (triggered by "candidates", "LinkedIn", recruiting intent)
2. Returns list of available skills with intents
3. Claude identifies `linkedin-lookup` or `candidate-pipeline-builder` as relevant

**What to verify:**
- Tool call appears in Claude's response
- Catalog includes skill names, descriptions, and "When to use" intents
- Claude picks an appropriate skill without being asked

---

## Test 2: Skill Instruction Fetch

**Prompt:**
> "Show me how the LinkedIn lookup skill works"

**Expected behavior:**
1. Claude calls `get_skill` with `slug: "linkedin-lookup"`
2. Returns full skill instructions including:
   - Prerequisites (browser extension)
   - Workflow steps
   - Search strategy
   - Output format
   - Limitations

**What to verify:**
- Full markdown instructions appear
- Includes actionable steps
- References related skills at the bottom

---

## Test 3: ATS Candidate Search

**Prompt:**
> "Search for Python developers in our ATS"

**Expected behavior:**
1. Claude calls `mock_ats_list_candidates` with search params
2. Returns list of matching candidates

**What to verify:**
- Tool call includes search query
- Response contains candidate data (name, email, skills)
- No errors about missing ATS integration

---

## Test 4: Multi-Step Recruiting Workflow

**Prompt:**
> "I need to build a candidate pipeline for this job: Senior Frontend Engineer, React/TypeScript, remote, 5+ years experience"

**Expected behavior:**
1. Claude calls `get_skill_catalog` to find relevant workflow
2. Claude calls `get_skill` for `candidate-pipeline-builder`
3. Claude follows the skill's instructions:
   - First searches ATS for existing candidates
   - Then suggests LinkedIn search
   - Offers to create scrape tasks

**What to verify:**
- Claude follows multi-step workflow
- Respects skill's embedded policies (e.g., "check ATS first")
- Asks before performing actions that modify data

---

## Test 5: Skill Not Found

**Prompt:**
> "Help me with payroll processing"

**Expected behavior:**
1. Claude may call `get_skill_catalog`
2. No matching skill found for payroll
3. Claude explains this is outside available workflows

**What to verify:**
- Claude doesn't hallucinate a payroll skill
- Suggests available recruiting-related alternatives
- Handles gracefully

---

## Test 6: ATS CRUD Operations

**Prompt:**
> "Create a new candidate: John Doe, john@example.com, Python developer"

**Expected behavior:**
1. Claude calls `mock_ats_create_candidate` with provided data
2. Returns created candidate with ID

**What to verify:**
- Candidate created successfully
- Response includes new candidate ID
- Claude confirms the action

---

## Test 7: Interview Notes

**Prompt:**
> "Show me interview notes for candidate cand-1"

**Expected behavior:**
1. Claude calls `mock_ats_get_candidate_interview_notes` with candidate ID
2. Returns list of interview notes with summaries

**What to verify:**
- Notes returned with interviewer, date, summary
- Full transcript available if requested

---

## Test 8: Scrape Task (requires browser extension)

**Prompt:**
> "Look up this LinkedIn profile: linkedin.com/in/someuser"

**Expected behavior:**
1. Claude calls `scrape_url` or `create_scrape_task`
2. If extension running: Returns scraped profile data
3. If extension not running: Returns pending status with helpful message

**What to verify:**
- Task created successfully
- Appropriate feedback if extension not connected
- Scraped content returned as markdown (if extension works)

---

## Test 9: Missing Integration Handling

**Setup:** Use an API key for a user without email integration

**Prompt:**
> "Draft an email to a candidate"

**Expected behavior:**
1. Claude attempts to use email tools
2. Either: No email tools available (not registered)
3. Or: Tool returns error about missing integration

**What to verify:**
- Clear error message about missing integration
- Suggests connecting email in dashboard

---

## Test 10: Tool Listing

**Prompt:**
> "What Skillomatic tools do you have access to?"

**Expected behavior:**
- Claude lists available tools
- Groups by category (skill discovery, ATS, scraping)
- Mentions which integrations are connected

**What to verify:**
- `get_skill_catalog` and `get_skill` always present
- ATS tools present (if ATS connected)
- Scrape tools always present
- Email/Calendar tools only if connected

---

## Troubleshooting

### MCP server not connecting
```bash
# Check logs
tail -f ~/Library/Logs/Claude/mcp*.log

# Common issues:
# - Invalid API key
# - API server not running
# - Wrong SKILLOMATIC_API_URL
```

### Tools not appearing
1. Restart Claude Desktop
2. Check MCP server logs for auth errors
3. Verify API key is valid: `curl http://localhost:3000/v1/me -H "Authorization: Bearer sk_test_..."`

### Skill catalog empty
1. Check skills exist in database
2. Verify skills are enabled for user's organization
3. Check `/skills` endpoint returns data

### ATS tools missing
1. Verify user has ATS integration connected
2. Check capabilities endpoint: `curl http://localhost:3000/skills/config -H "Authorization: Bearer sk_test_..."`
