import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, ONBOARDING_STEPS, MAX_ONBOARDING_STEP } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { OnboardingStatus } from '@skillomatic/shared';
import { getNextOnboardingStep, getOnboardingStepName } from '@skillomatic/shared';

export const onboardingRoutes = new Hono();

/**
 * GET /onboarding/status
 * Get the current user's onboarding status
 */
onboardingRoutes.get('/status', jwtAuth, async (c) => {
  const user = c.get('user');

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const currentStep = dbUser.onboardingStep ?? 0;
  const isComplete = currentStep >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(currentStep);

  const status: OnboardingStatus = {
    currentStep,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null,
  };

  return c.json({ data: status });
});

/**
 * POST /onboarding/advance
 * Advance the user's onboarding to a specific step (must be >= current step)
 */
onboardingRoutes.post('/advance', jwtAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ step: number }>();

  if (typeof body.step !== 'number') {
    return c.json({ error: { message: 'Step must be a number' } }, 400);
  }

  // Get current step
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const currentStep = dbUser.onboardingStep ?? 0;

  // Only allow advancing forward (or staying same)
  if (body.step < currentStep) {
    return c.json(
      { error: { message: 'Cannot go back in onboarding. Current step: ' + currentStep } },
      400
    );
  }

  // Update the step
  await db
    .update(users)
    .set({
      onboardingStep: body.step,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const isComplete = body.step >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(body.step);

  const status: OnboardingStatus = {
    currentStep: body.step,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null,
  };

  return c.json({ data: status });
});

/**
 * POST /onboarding/complete-step
 * Complete a specific named step (e.g., 'ATS_CONNECTED')
 * This is a convenience endpoint that looks up the step value by name
 */
onboardingRoutes.post('/complete-step', jwtAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ stepName: keyof typeof ONBOARDING_STEPS }>();

  if (!body.stepName || !(body.stepName in ONBOARDING_STEPS)) {
    return c.json(
      {
        error: {
          message: 'Invalid step name. Valid steps: ' + Object.keys(ONBOARDING_STEPS).join(', '),
        },
      },
      400
    );
  }

  const stepValue = ONBOARDING_STEPS[body.stepName];

  // Get current step
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const currentStep = dbUser.onboardingStep ?? 0;

  // Only update if this step is ahead of current
  if (stepValue <= currentStep) {
    // Already at or past this step, return current status
    const isComplete = currentStep >= MAX_ONBOARDING_STEP;
    const nextStep = getNextOnboardingStep(currentStep);

    return c.json({
      data: {
        currentStep,
        isComplete,
        nextStep,
        nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null,
        message: 'Already completed this step',
      },
    });
  }

  // Update the step
  await db
    .update(users)
    .set({
      onboardingStep: stepValue,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const isComplete = stepValue >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(stepValue);

  const status: OnboardingStatus = {
    currentStep: stepValue,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null,
  };

  return c.json({ data: status });
});

/**
 * POST /onboarding/reset
 * Reset onboarding to the beginning (for testing/admin purposes)
 * Only super admins can reset their own onboarding
 */
onboardingRoutes.post('/reset', jwtAuth, async (c) => {
  const user = c.get('user');

  if (!user.isSuperAdmin) {
    return c.json({ error: { message: 'Only super admins can reset onboarding' } }, 403);
  }

  await db
    .update(users)
    .set({
      onboardingStep: ONBOARDING_STEPS.NOT_STARTED,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const nextStep = getNextOnboardingStep(ONBOARDING_STEPS.NOT_STARTED);

  const status: OnboardingStatus = {
    currentStep: ONBOARDING_STEPS.NOT_STARTED,
    isComplete: false,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null,
  };

  return c.json({ data: status });
});

/**
 * GET /onboarding - Simple getting started guide for new users
 *
 * A streamlined onboarding flow for recruiters joining an org
 * that already has Skillomatic set up.
 */
onboardingRoutes.get('/', (c) => {
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const markdown = `# Welcome to Skillomatic

Skillomatic lets you search candidates, manage your ATS, and source from LinkedIn - all through natural conversation in Claude.

**Goal:** Get you out of dashboards and into Claude in 5 minutes.

---

## One-Time Setup

### 1. Get Your API Key

1. Go to ${baseUrl} and sign in
2. Click **API Keys** > **Generate Key**
3. Copy the key (starts with \`sk_live_\`)

### 2. Save It (Terminal)

\`\`\`bash
security add-generic-password -a $USER -s SKILLOMATIC_API_KEY -w 'PASTE_KEY_HERE'
echo 'export SKILLOMATIC_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLOMATIC_API_KEY" -w 2>/dev/null)' >> ~/.zshrc
source ~/.zshrc
\`\`\`

### 3. Install Skills

\`\`\`bash
mkdir -p ~/.claude/commands
\`\`\`

Download skills from ${baseUrl}/skills and move to \`~/.claude/commands/\`

---

## Start Using Claude

Open **Claude Code** or **Claude Desktop** and try:

\`\`\`
/ats-candidate-search

Senior backend engineer, 5+ years Python, Bay Area
\`\`\`

That's it. You're sourcing candidates through conversation now.

---

## What You Can Do

| Instead of... | Just ask Claude |
|---------------|-----------------|
| Clicking through ATS filters | \`/ats-candidate-search\` + paste job description |
| Manually searching LinkedIn | \`/linkedin-lookup\` + describe ideal candidate |
| Copy-pasting into spreadsheets | \`/daily-report\` for activity summaries |
| Typing candidate info into ATS | \`/ats-candidate-crud\` + "add Jane Doe..." |

Chain them together: *"Find Python engineers on LinkedIn, add the top 3 to our ATS, and draft outreach emails"*

---

## LinkedIn Setup (Optional)

For \`/linkedin-lookup\`, install the browser extension:

1. Get extension from IT (or load \`apps/skillomatic-scraper/\` in Chrome)
2. Click extension icon > enter API URL \`${baseUrl}\` + your API key
3. Stay logged into LinkedIn in Chrome

Guide: ${baseUrl}/extension

---

## Help

Stuck? Ask Claude: *"Run /skillomatic-health-check"*

API key issues? Regenerate at ${baseUrl}
`;

  return c.text(markdown, 200, {
    'Content-Type': 'text/markdown',
  });
});
