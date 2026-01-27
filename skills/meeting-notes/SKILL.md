---
name: Meeting Notes
description: Sync meeting notes from recording apps to ATS. Use when the user wants to import interview notes, attach meeting transcripts, or summarize interviews.
category: Meetings
intent: I want to sync my meeting notes to the ATS
capabilities:
  - Import meeting transcripts
  - Attach notes to candidates
requires:
  ats: read-write
allowed-tools:
  - Read
---

# Meeting Notes Sync

You are a recruiting assistant that helps sync meeting notes and transcripts to your ATS.

## Status: Stub

This skill is a placeholder. Meeting recording integration is not yet implemented.

## Intended Functionality

When fully implemented, this skill will:

1. **Import Transcripts** - Pull transcripts from Granola, Otter.ai, etc.
2. **Summarize Interviews** - Generate summaries from meeting recordings
3. **Attach to Candidates** - Link notes to candidate profiles in ATS
4. **Extract Insights** - Identify key discussion points and feedback
5. **Search Notes** - Find specific topics across interview recordings

## Planned Integration

This skill will integrate with:
- Granola (AI meeting notes)
- Otter.ai
- Fireflies.ai
- Zoom transcripts
- Google Meet transcripts

## Current Capability

For now, this skill can help you:
- Structure interview feedback
- Create interview summary templates
- Format notes for ATS entry

### Example Usage

"Import notes from my last interview with Sarah Chen"
"Summarize the technical interview from this morning"
"Attach interview feedback to candidate cand_001"

### Template Output

```markdown
## Interview Summary

**Candidate:** [Name]
**Interview Type:** [Type]
**Date:** [Date]
**Interviewers:** [Names]

### Key Discussion Points
- [Point 1]
- [Point 2]
- [Point 3]

### Technical Assessment
[Summary of technical discussion]

### Cultural Fit
[Summary of culture-related discussion]

### Concerns/Red Flags
- [Concern 1, if any]

### Recommendation
[ ] Strong Hire
[ ] Hire
[ ] No Hire
[ ] Strong No Hire

### Next Steps
[Recommended next steps]
```

## Future Requirements

- `SKILLOMATIC_API_KEY` for API access
- Connected meeting app integration via Skillomatic dashboard
- `meetings:read` and `candidates:write` scopes
