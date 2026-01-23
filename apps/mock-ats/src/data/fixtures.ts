import type { Candidate, Job, Application, InterviewNote } from '@skillomatic/shared';

export const candidates: Candidate[] = [
  {
    id: 'cand_001',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@email.com',
    phone: '+1-555-0101',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    headline: 'Senior Software Engineer',
    summary: '8+ years of experience in full-stack development with expertise in React, Node.js, and distributed systems.',
    location: { city: 'San Francisco', state: 'CA', country: 'USA' },
    source: 'sourced',
    sourceDetail: 'LinkedIn',
    attachments: [
      { id: 'att_001', type: 'resume', filename: 'sarah_chen_resume.pdf', url: '/mock/resumes/001.pdf', createdAt: '2024-01-15T10:00:00Z' }
    ],
    tags: ['javascript', 'react', 'node.js', 'senior', 'full-stack'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'cand_002',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'mrodriguez@email.com',
    phone: '+1-555-0102',
    linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
    headline: 'Product Manager',
    summary: 'Product leader with 6 years of experience building B2B SaaS products. Previously at Stripe and Notion.',
    location: { city: 'New York', state: 'NY', country: 'USA' },
    source: 'applied',
    attachments: [
      { id: 'att_002', type: 'resume', filename: 'michael_rodriguez_resume.pdf', url: '/mock/resumes/002.pdf', createdAt: '2024-01-18T09:00:00Z' }
    ],
    tags: ['product-management', 'b2b', 'saas', 'senior'],
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z'
  },
  {
    id: 'cand_003',
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.j@email.com',
    phone: '+1-555-0103',
    linkedinUrl: 'https://linkedin.com/in/emilyjohnson',
    headline: 'Frontend Engineer',
    summary: '4 years of experience building responsive web applications with React and TypeScript.',
    location: { city: 'Austin', state: 'TX', country: 'USA' },
    source: 'referral',
    sourceDetail: 'Employee referral - John Smith',
    attachments: [
      { id: 'att_003', type: 'resume', filename: 'emily_johnson_resume.pdf', url: '/mock/resumes/003.pdf', createdAt: '2024-01-20T11:00:00Z' }
    ],
    tags: ['javascript', 'react', 'typescript', 'frontend', 'mid-level'],
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z'
  },
  {
    id: 'cand_004',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@email.com',
    phone: '+1-555-0104',
    linkedinUrl: 'https://linkedin.com/in/davidkim',
    headline: 'DevOps Engineer',
    summary: '5 years of experience with AWS, Kubernetes, and CI/CD pipelines. Certified AWS Solutions Architect.',
    location: { city: 'Seattle', state: 'WA', country: 'USA' },
    source: 'sourced',
    sourceDetail: 'LinkedIn',
    attachments: [
      { id: 'att_004', type: 'resume', filename: 'david_kim_resume.pdf', url: '/mock/resumes/004.pdf', createdAt: '2024-01-22T08:00:00Z' }
    ],
    tags: ['devops', 'aws', 'kubernetes', 'docker', 'ci-cd'],
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-22T08:00:00Z'
  },
  {
    id: 'cand_005',
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jwilliams@email.com',
    phone: '+1-555-0105',
    linkedinUrl: 'https://linkedin.com/in/jessicawilliams',
    headline: 'Data Scientist',
    summary: 'PhD in Machine Learning with 3 years of industry experience. Specialized in NLP and recommendation systems.',
    location: { city: 'Boston', state: 'MA', country: 'USA' },
    source: 'applied',
    attachments: [
      { id: 'att_005', type: 'resume', filename: 'jessica_williams_resume.pdf', url: '/mock/resumes/005.pdf', createdAt: '2024-01-23T13:00:00Z' }
    ],
    tags: ['machine-learning', 'python', 'nlp', 'data-science', 'phd'],
    createdAt: '2024-01-23T13:00:00Z',
    updatedAt: '2024-01-23T13:00:00Z'
  },
  {
    id: 'cand_006',
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex.t@email.com',
    phone: '+1-555-0106',
    linkedinUrl: 'https://linkedin.com/in/alexthompson',
    headline: 'UX Designer',
    summary: '7 years of experience in product design. Expert in user research, prototyping, and design systems.',
    location: { city: 'Los Angeles', state: 'CA', country: 'USA' },
    source: 'agency',
    sourceDetail: 'TechRecruit Agency',
    attachments: [
      { id: 'att_006', type: 'portfolio', filename: 'alex_thompson_portfolio.pdf', url: '/mock/portfolios/006.pdf', createdAt: '2024-01-24T10:00:00Z' }
    ],
    tags: ['ux-design', 'figma', 'user-research', 'senior'],
    createdAt: '2024-01-24T10:00:00Z',
    updatedAt: '2024-01-24T10:00:00Z'
  },
  {
    id: 'cand_007',
    firstName: 'Ryan',
    lastName: 'Patel',
    email: 'ryan.patel@email.com',
    phone: '+1-555-0107',
    linkedinUrl: 'https://linkedin.com/in/ryanpatel',
    headline: 'Backend Engineer',
    summary: '3 years of experience with Python and Go. Strong foundation in distributed systems and API design.',
    location: { city: 'Chicago', state: 'IL', country: 'USA' },
    source: 'applied',
    attachments: [
      { id: 'att_007', type: 'resume', filename: 'ryan_patel_resume.pdf', url: '/mock/resumes/007.pdf', createdAt: '2024-01-25T09:00:00Z' }
    ],
    tags: ['python', 'go', 'backend', 'api', 'mid-level'],
    createdAt: '2024-01-25T09:00:00Z',
    updatedAt: '2024-01-25T09:00:00Z'
  },
  {
    id: 'cand_008',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1-555-0108',
    linkedinUrl: 'https://linkedin.com/in/mariagarcia',
    headline: 'Engineering Manager',
    summary: '10+ years in software engineering, 4 years managing teams. Led growth team at Series C startup.',
    location: { city: 'Denver', state: 'CO', country: 'USA' },
    source: 'sourced',
    sourceDetail: 'LinkedIn',
    attachments: [
      { id: 'att_008', type: 'resume', filename: 'maria_garcia_resume.pdf', url: '/mock/resumes/008.pdf', createdAt: '2024-01-26T11:00:00Z' }
    ],
    tags: ['engineering-manager', 'leadership', 'growth', 'senior'],
    createdAt: '2024-01-26T11:00:00Z',
    updatedAt: '2024-01-26T11:00:00Z'
  },
  {
    id: 'cand_009',
    firstName: 'James',
    lastName: 'Lee',
    email: 'james.lee@email.com',
    phone: '+1-555-0109',
    linkedinUrl: 'https://linkedin.com/in/jameslee',
    headline: 'Mobile Developer',
    summary: '5 years of experience with iOS and React Native. Published 3 apps with 1M+ downloads.',
    location: { city: 'Portland', state: 'OR', country: 'USA' },
    source: 'referral',
    sourceDetail: 'Employee referral - Sarah Chen',
    attachments: [
      { id: 'att_009', type: 'resume', filename: 'james_lee_resume.pdf', url: '/mock/resumes/009.pdf', createdAt: '2024-01-27T14:00:00Z' }
    ],
    tags: ['ios', 'react-native', 'mobile', 'swift', 'mid-level'],
    createdAt: '2024-01-27T14:00:00Z',
    updatedAt: '2024-01-27T14:00:00Z'
  },
  {
    id: 'cand_010',
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.b@email.com',
    phone: '+1-555-0110',
    linkedinUrl: 'https://linkedin.com/in/amandabrown',
    headline: 'QA Engineer',
    summary: '4 years of experience in test automation. Expert in Selenium, Cypress, and performance testing.',
    location: { city: 'Atlanta', state: 'GA', country: 'USA' },
    source: 'applied',
    attachments: [
      { id: 'att_010', type: 'resume', filename: 'amanda_brown_resume.pdf', url: '/mock/resumes/010.pdf', createdAt: '2024-01-28T08:00:00Z' }
    ],
    tags: ['qa', 'automation', 'selenium', 'cypress', 'testing'],
    createdAt: '2024-01-28T08:00:00Z',
    updatedAt: '2024-01-28T08:00:00Z'
  },
];

export const jobs: Job[] = [
  {
    id: 'job_001',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'full-time',
    description: 'We are looking for a Senior Frontend Engineer to join our product team and help build the next generation of our platform.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Experience with design systems'],
    niceToHave: ['GraphQL experience', 'Accessibility expertise', 'Performance optimization'],
    salary: { min: 180000, max: 220000, currency: 'USD' },
    status: 'open',
    hiringManagerId: 'user_hm_001',
    recruiterId: 'user_rec_001',
    openDate: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'job_002',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York, NY (Remote)',
    employmentType: 'full-time',
    description: 'Join our product team to drive strategy and execution for our core platform features.',
    requirements: ['5+ years product management experience', 'B2B SaaS background', 'Strong analytical skills'],
    niceToHave: ['Technical background', 'Enterprise sales experience'],
    salary: { min: 160000, max: 200000, currency: 'USD' },
    status: 'open',
    hiringManagerId: 'user_hm_002',
    recruiterId: 'user_rec_001',
    openDate: '2024-01-05T00:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'job_003',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Seattle, WA (On-site)',
    employmentType: 'full-time',
    description: 'We need a DevOps Engineer to help scale our infrastructure and improve our deployment processes.',
    requirements: ['3+ years DevOps experience', 'AWS expertise', 'Kubernetes experience'],
    niceToHave: ['Terraform', 'Security certifications'],
    salary: { min: 150000, max: 190000, currency: 'USD' },
    status: 'open',
    hiringManagerId: 'user_hm_001',
    recruiterId: 'user_rec_002',
    openDate: '2024-01-10T00:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 'job_004',
    title: 'Data Scientist',
    department: 'Data',
    location: 'Boston, MA (Hybrid)',
    employmentType: 'full-time',
    description: 'Looking for a Data Scientist to work on our recommendation engine and analytics platform.',
    requirements: ['MS/PhD in relevant field', 'Python expertise', 'ML model deployment experience'],
    niceToHave: ['NLP experience', 'Real-time ML systems'],
    salary: { min: 170000, max: 210000, currency: 'USD' },
    status: 'open',
    hiringManagerId: 'user_hm_003',
    recruiterId: 'user_rec_001',
    openDate: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'job_005',
    title: 'UX Designer',
    department: 'Design',
    location: 'Los Angeles, CA (Remote)',
    employmentType: 'full-time',
    description: 'Join our design team to create intuitive and delightful user experiences.',
    requirements: ['5+ years UX design experience', 'Strong portfolio', 'Figma expertise'],
    niceToHave: ['Design system experience', 'User research skills'],
    salary: { min: 140000, max: 180000, currency: 'USD' },
    status: 'open',
    hiringManagerId: 'user_hm_004',
    recruiterId: 'user_rec_002',
    openDate: '2024-01-20T00:00:00Z',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
];

export const applications: Application[] = [
  {
    id: 'app_001',
    candidateId: 'cand_001',
    jobId: 'job_001',
    status: 'interview',
    stage: 'Technical Interview',
    stageHistory: [
      { fromStage: 'New', toStage: 'Screening', movedAt: '2024-01-16T10:00:00Z', movedBy: 'user_rec_001' },
      { fromStage: 'Screening', toStage: 'Technical Interview', movedAt: '2024-01-18T14:00:00Z', movedBy: 'user_rec_001' },
    ],
    appliedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z'
  },
  {
    id: 'app_002',
    candidateId: 'cand_002',
    jobId: 'job_002',
    status: 'screening',
    stage: 'Phone Screen',
    stageHistory: [
      { fromStage: 'New', toStage: 'Phone Screen', movedAt: '2024-01-19T09:00:00Z', movedBy: 'user_rec_001' },
    ],
    appliedAt: '2024-01-18T09:00:00Z',
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z'
  },
  {
    id: 'app_003',
    candidateId: 'cand_003',
    jobId: 'job_001',
    status: 'new',
    stage: 'New',
    stageHistory: [],
    appliedAt: '2024-01-20T11:00:00Z',
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z'
  },
  {
    id: 'app_004',
    candidateId: 'cand_004',
    jobId: 'job_003',
    status: 'interview',
    stage: 'Onsite',
    stageHistory: [
      { fromStage: 'New', toStage: 'Screening', movedAt: '2024-01-23T08:00:00Z', movedBy: 'user_rec_002' },
      { fromStage: 'Screening', toStage: 'Technical Interview', movedAt: '2024-01-25T10:00:00Z', movedBy: 'user_rec_002' },
      { fromStage: 'Technical Interview', toStage: 'Onsite', movedAt: '2024-01-27T14:00:00Z', movedBy: 'user_rec_002' },
    ],
    appliedAt: '2024-01-22T08:00:00Z',
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-27T14:00:00Z'
  },
  {
    id: 'app_005',
    candidateId: 'cand_005',
    jobId: 'job_004',
    status: 'screening',
    stage: 'Phone Screen',
    stageHistory: [
      { fromStage: 'New', toStage: 'Phone Screen', movedAt: '2024-01-24T13:00:00Z', movedBy: 'user_rec_001' },
    ],
    appliedAt: '2024-01-23T13:00:00Z',
    createdAt: '2024-01-23T13:00:00Z',
    updatedAt: '2024-01-24T13:00:00Z'
  },
];

// ============ INTERVIEW NOTES ============

export const interviewNotes: InterviewNote[] = [
  {
    id: 'note_001',
    candidateId: 'cand_001',
    applicationId: 'app_001',
    jobId: 'job_001',
    type: 'phone_screen',
    title: 'Initial Phone Screen - Sarah Chen',
    interviewers: ['Jennifer Martinez'],
    interviewDate: '2024-01-17T14:00:00Z',
    duration: 32,
    summary: 'Strong candidate with excellent React experience. Currently at a Series B startup leading frontend architecture. Looking for more ownership and equity. Salary expectations align with our range. Moving forward to technical interview.',
    rating: 4,
    recommendation: 'hire',
    highlights: [
      'Led migration from class components to hooks across 200+ components',
      'Experience with design systems and component libraries',
      'Strong communication skills, articulate about technical decisions'
    ],
    concerns: [
      'Limited experience with GraphQL (we use it heavily)',
      'Has not worked in a larger organization before'
    ],
    source: 'manual',
    transcript: `[00:00] Jennifer: Hi Sarah, thanks for taking the time to chat today. How are you doing?

[00:05] Sarah: Hi Jennifer! I'm doing great, thanks. Really excited to learn more about the role.

[00:12] Jennifer: Wonderful. So I've had a chance to review your resume, and I'm impressed with your background. Can you start by telling me a bit about your current role?

[00:22] Sarah: Sure! I'm currently a Senior Frontend Engineer at TechFlow, which is a Series B startup in the developer tools space. I've been there for about two and a half years. I joined when we were about 15 engineers and now we're at around 45.

[00:38] Jennifer: That's great growth. What are you primarily working on there?

[00:42] Sarah: So I lead our frontend architecture initiatives. My biggest project was leading our migration from class components to React hooks across our entire codebase - we had about 200 components to migrate. I also built out our internal component library from scratch, which is now used across three different products.

[01:05] Jennifer: That sounds like significant work. What drove the decision to migrate to hooks?

[01:12] Sarah: A few things. First, we were seeing a lot of bugs related to lifecycle methods being used incorrectly, especially around cleanup. Second, we wanted to share stateful logic between components more easily, and custom hooks made that so much cleaner. Third, honestly, hiring - newer engineers are more familiar with hooks, and it made onboarding faster.

[01:38] Jennifer: Makes sense. How did you approach the migration? All at once or incrementally?

[01:44] Sarah: Incrementally, definitely. We created a migration guide, set up linting rules to catch common mistakes, and did it feature by feature over about four months. I also ran weekly office hours where anyone could bring their tricky migration cases and we'd work through them together.

[02:08] Jennifer: I love that approach. Now, tell me about the component library. What technologies did you use?

[02:16] Sarah: We built it with TypeScript, Styled Components for styling, and Storybook for documentation. Each component has full type safety, and we have visual regression tests using Chromatic. The library handles about 80% of our UI needs now - buttons, forms, modals, tables, that kind of thing.

[02:42] Jennifer: We use a similar stack actually. One thing I should mention - we're pretty heavy on GraphQL here. What's your experience with that?

[02:52] Sarah: Honestly, that's an area where I have less experience. We use REST APIs at TechFlow. I've done some personal projects with Apollo Client and I understand the concepts - queries, mutations, caching - but I haven't used it in production at scale. I'd definitely want to ramp up on that.

[03:15] Jennifer: Appreciate the honesty. It's something you'd learn on the job for sure. Let me ask you about what you're looking for in your next role.

[03:24] Sarah: A few things. First, I want more ownership and impact. At TechFlow, I've grown a lot, but there are limits to how much I can influence the broader technical direction. I want to be in a place where I can help shape the architecture for the whole company. Second, equity is important to me - I believe in aligning incentives. And third, I want to work with people I can learn from.

[03:58] Jennifer: Those all make sense. On the compensation side, what are you looking for?

[04:04] Sarah: I'm currently at around $175k base with about 0.1% equity. For the right opportunity, I'd be looking at $180 to $200k base, and equity is really important to me at this stage of my career.

[04:22] Jennifer: That's within our range, so that's good. Let me tell you a bit about the role and the team...

[04:30] Sarah: That would be great.

[04:32] Jennifer: So we're a team of about 8 frontend engineers, part of a broader engineering org of around 60. The role would be on our core product team, working on the main customer-facing application. We're rebuilding significant parts of the UI right now - moving from our legacy Angular codebase to React. So someone with migration experience like yours would be super valuable.

[05:02] Sarah: Oh interesting! How far along is the migration?

[05:06] Jennifer: We're about 30% done. The new code is all React with TypeScript, using GraphQL for data fetching. We have a component library but it needs a lot of love - that could be an area you'd own.

[05:22] Sarah: That sounds really exciting actually. Leading a component library refresh while helping with a migration is right in my wheelhouse.

[05:32] Jennifer: Great to hear. I think you'd be a strong fit. The next step would be a technical interview with two of our senior engineers. They'll do some coding together with you and dig deeper into your React experience. Does that sound good?

[05:48] Sarah: Absolutely, I'm looking forward to it.

[05:52] Jennifer: Perfect. I'll have our recruiting coordinator reach out to schedule. Any questions for me?

[05:58] Sarah: Yes, a couple. What's the team culture like? And what does success look like in this role in the first six months?

[06:08] Jennifer: Great questions. The culture is collaborative but autonomous. We don't micromanage - we set goals and trust people to figure out how to achieve them. We do a lot of pair programming and code reviews. For the first six months, success would be shipping at least one significant feature, contributing meaningfully to the migration, and starting to establish yourself as a go-to person for frontend questions.

[06:42] Sarah: That sounds great. I really like the autonomy piece - that's important to me.

[06:48] Jennifer: Wonderful. Well, I think we're at time. Thanks so much for chatting, Sarah. You'll hear from us soon about next steps.

[06:56] Sarah: Thank you, Jennifer! I really enjoyed the conversation and I'm excited about the opportunity.

[07:02] Jennifer: Talk soon. Bye!

[07:04] Sarah: Bye!`,
    createdAt: '2024-01-17T15:00:00Z',
    updatedAt: '2024-01-17T15:00:00Z'
  },
  {
    id: 'note_002',
    candidateId: 'cand_001',
    applicationId: 'app_001',
    jobId: 'job_001',
    type: 'technical',
    title: 'Technical Interview - Sarah Chen',
    interviewers: ['Marcus Wong', 'Priya Sharma'],
    interviewDate: '2024-01-19T10:00:00Z',
    duration: 58,
    summary: 'Excellent technical interview. Sarah demonstrated deep React knowledge, good system design thinking, and wrote clean code. She handled the performance optimization question particularly well, showing real-world experience with profiling and debugging. Minor gap on GraphQL but nothing that can\'t be learned. Strong recommend for onsite.',
    rating: 5,
    recommendation: 'strong_hire',
    highlights: [
      'Excellent understanding of React rendering and performance optimization',
      'Clean, readable code with good testing instincts',
      'Asked clarifying questions before diving into problems',
      'Great explanation of tradeoffs in state management solutions'
    ],
    concerns: [
      'Would need GraphQL ramp-up time'
    ],
    source: 'brighthire',
    transcript: `[00:00] Marcus: Hey Sarah, good to meet you. I'm Marcus, one of the senior engineers on the team, and this is Priya.

[00:06] Priya: Hi Sarah! Nice to meet you.

[00:08] Sarah: Hi both! Great to meet you too. I've been looking forward to this.

[00:14] Marcus: Awesome. So today we're going to do a mix of technical discussion and some hands-on coding. We'll share a CoderPad link in the chat. Sound good?

[00:24] Sarah: Perfect, let me grab that.

[00:28] Marcus: Great. So let's start with a discussion question. Can you walk us through how React's rendering process works? Like, what happens when state changes?

[00:42] Sarah: Sure. So when state changes in a component, React creates a new virtual DOM tree for that component and its children. It then diffs this new tree against the previous one - that's the reconciliation process. React identifies the minimal set of changes needed, and then commits those changes to the actual DOM in the commit phase.

[01:08] Sarah: The key thing is that rendering is triggered from the component where state changed, and it cascades down to children. React.memo can prevent unnecessary re-renders if props haven't changed, and useMemo and useCallback can help with reference stability.

[01:28] Marcus: Good explanation. How would you debug a performance issue where the UI feels sluggish?

[01:36] Sarah: I'd start with React DevTools Profiler. It shows you exactly which components are rendering and how long they take. I'd look for components that are rendering when they shouldn't be, or components with long render times.

[01:52] Sarah: Common culprits are missing keys in lists, creating new object or array references on every render, expensive calculations in render, and components that aren't memoized when they should be.

[02:10] Sarah: I'd also check the Chrome Performance tab to see if it's actually React work or something else like layout thrashing or network requests blocking the main thread.

[02:24] Marcus: Nice, very thorough. Priya, want to jump into the coding part?

[02:30] Priya: Sure! Sarah, in the CoderPad, I've set up a simple React environment. We want to build a search component that filters a list of users as you type. Let's start simple and iterate.

[02:48] Sarah: Okay, let me see what we have... Got it. So I see we have a users array. Let me start by setting up the basic structure.

[03:02] Sarah: I'll create a Search component with a controlled input and useState for the search term. Then filter the users based on whether their name includes the search term.

[03:20] Sarah: [typing] Okay so... useState for searchTerm, filter the users, map over results to render. Let me write that out.

[04:15] Sarah: Here's my initial implementation. I'm filtering case-insensitively by lowercasing both the search term and the name.

[04:25] Priya: Looks good. What if the users array was really large, say 10,000 items? Would this implementation have any issues?

[04:36] Sarah: Yes, filtering on every keystroke would be expensive. I'd add debouncing - wait for the user to stop typing before filtering. I'd use a useDeferredValue or write a custom debounce hook with useEffect and setTimeout.

[04:58] Sarah: Should I implement the debouncing?

[05:02] Priya: Yes please, let's see that.

[05:06] Sarah: [typing] Okay, I'll create a useDebounce hook. It takes a value and a delay, and returns the debounced value. Inside, I'll use useEffect to set a timeout...

[06:45] Sarah: There we go. Now the filtering only happens after the user stops typing for 300 milliseconds.

[06:52] Priya: Nice. One more question - what if the filtering was async? Like we were fetching search results from an API?

[07:02] Sarah: Good question. For async, I'd want to handle a few things: loading state, error state, and race conditions where an older request returns after a newer one.

[07:18] Sarah: For race conditions, I'd either use an AbortController to cancel previous requests, or keep track of which request is the latest and only update state for that one. Want me to implement that?

[07:35] Priya: No, that's a great explanation. Marcus, want to do the system design part?

[07:42] Marcus: Sure. Sarah, let's zoom out. Imagine you're designing the frontend architecture for a dashboard that displays real-time data - like live metrics, charts updating every few seconds. How would you approach that?

[08:00] Sarah: Interesting. So first I'd want to understand the data characteristics - how often it updates, how much data, how many concurrent users need to see the same data.

[08:16] Sarah: For real-time, I'd likely use WebSockets rather than polling. On the frontend, I'd need to think carefully about state management. If multiple components need the same real-time data, I don't want them each opening separate connections.

[08:38] Sarah: I'd probably create a context or use a state management library to hold the WebSocket connection and broadcast updates. Components subscribe to the parts of the data they need.

[08:55] Sarah: For the charts, I'd want to be careful about re-renders. If data updates every second, I can't re-render the whole chart each time. I'd look at using refs to update the chart data directly without triggering React re-renders, or using a virtualized approach if we're dealing with a lot of data points.

[09:22] Marcus: What about if a user opens the dashboard but their connection is slow or unreliable?

[09:30] Sarah: I'd want graceful degradation. First, show stale data with a timestamp so users know how fresh it is. Second, implement reconnection logic for the WebSocket - exponential backoff on disconnect. Third, maybe offer a manual refresh option. Fourth, consider falling back to polling if WebSockets aren't working.

[09:58] Sarah: Also, I'd cache the last known state so if they refresh the page, they see something immediately while the WebSocket reconnects.

[10:10] Marcus: Great answer. Priya and I are going to step out for a minute to confer. Help yourself to a break if you want.

[10:20] Sarah: Sounds good, thanks!

... [interview continues with more technical discussion and Q&A] ...

[55:00] Marcus: Alright Sarah, we're about out of time. Do you have any questions for us?

[55:06] Sarah: Yes! What's the most challenging technical problem your team has faced recently?

[55:14] Priya: Oh, good question. We had this issue with our data grid component where it needed to handle hundreds of thousands of rows with inline editing. Getting that performant was a real journey - we ended up implementing our own virtualization after trying several libraries.

[55:38] Sarah: That sounds really interesting. Did you end up writing about it? I'd love to read more.

[55:44] Marcus: Not yet, but we should! Anything else?

[55:48] Sarah: What does the day-to-day look like for the team?

[55:52] Marcus: Pretty flexible. We do standups three times a week, not daily. Most of us come in Tuesday through Thursday but remote is fine other days. We do pair programming a lot, especially for complex features. Fridays are usually for tech debt, learning, or side projects.

[56:18] Sarah: That sounds like a great setup. Thanks so much for your time today!

[56:24] Priya: Thank you Sarah! We really enjoyed talking with you.

[56:28] Marcus: Yeah, great conversation. You'll hear from the recruiting team soon. Take care!

[56:34] Sarah: Thanks! Bye!`,
    createdAt: '2024-01-19T11:30:00Z',
    updatedAt: '2024-01-19T11:30:00Z'
  },
  {
    id: 'note_003',
    candidateId: 'cand_004',
    applicationId: 'app_004',
    jobId: 'job_003',
    type: 'technical',
    title: 'Technical Interview - David Kim',
    interviewers: ['Alex Rivera'],
    interviewDate: '2024-01-26T09:00:00Z',
    duration: 45,
    summary: 'Solid DevOps knowledge with strong AWS and Kubernetes experience. David explained complex infrastructure concepts clearly and showed good debugging methodology. His experience with cost optimization is particularly relevant for us. Ready for onsite.',
    rating: 4,
    recommendation: 'hire',
    highlights: [
      'Deep Kubernetes knowledge including custom operators',
      'Saved previous company $300k/year on AWS costs',
      'Strong debugging and incident response skills',
      'Clear communicator, explains technical concepts well'
    ],
    concerns: [
      'Less experience with Terraform (we use it extensively)',
      'Has not worked with our specific monitoring stack (Datadog)'
    ],
    source: 'metaview',
    transcript: `[00:00] Alex: Hi David, I'm Alex, the engineering manager for our infrastructure team. Thanks for joining today.

[00:08] David: Hey Alex, great to meet you. I've been reading about your engineering blog posts - the one about your Kubernetes migration was really interesting.

[00:18] Alex: Oh thanks! That was quite a journey. Speaking of which, I see you have a lot of Kubernetes experience. Can you tell me about your current setup?

[00:28] David: Sure. We run about 40 microservices on EKS across three environments - dev, staging, and prod. I was the lead on our migration from EC2-based deployments about two years ago.

[00:44] David: We use Helm for packaging, ArgoCD for GitOps-style deployments, and have built some custom operators for things like database provisioning and secret rotation.

[01:00] Alex: Custom operators - that's interesting. What drove that decision versus using existing solutions?

[01:08] David: We had some specific requirements around how we provision databases. We needed to automatically create read replicas with specific configurations when services declare them in their CRDs. The existing solutions either didn't support our use case or were overkill.

[01:30] David: Writing a custom operator with kubebuilder turned out to be pretty straightforward once we understood the reconciliation loop pattern.

[01:42] Alex: Nice. What about CI/CD? Walk me through how code gets from a developer's machine to production.

[01:50] David: So developer pushes to GitHub, that triggers GitHub Actions for the initial build and test. If tests pass and it's a merge to main, we build the Docker image, push to ECR, and update the Helm chart values file with the new image tag.

[02:14] David: ArgoCD watches that repo and automatically syncs changes to the staging environment. For production, we have a manual approval gate - someone has to review the staging deployment and click approve in ArgoCD before it rolls out to prod.

[02:38] David: We also have automated canary deployments for high-traffic services - we route 5% of traffic to new pods first and monitor error rates before rolling out fully.

[02:52] Alex: Speaking of monitoring, what's your observability setup?

[02:58] David: We use Prometheus and Grafana for metrics, ELK stack for logs, and Jaeger for distributed tracing. I set up alerts for the usual things - CPU, memory, error rates, latency percentiles - but also some business-specific ones.

[03:18] David: One thing I'm proud of is building a cost dashboard that tracks AWS spend per service per environment. It helped us identify that one team was running way more resources than they needed, and we cut their costs by 60%.

[03:38] Alex: Cost optimization is huge for us right now actually. Can you tell me more about that?

[03:44] David: Yeah so I did a company-wide cost audit last year. The big wins were: switching to spot instances for non-critical workloads - that saved about 70% on those compute costs. Setting up proper autoscaling - some services were way over-provisioned. And right-sizing RDS instances based on actual usage.

[04:14] David: In total we saved about $300k annually, which was about 25% of our cloud spend.

[04:22] Alex: That's impressive. Now let me give you a scenario. It's 2am and you get paged - the website is down. Walk me through your debugging process.

[04:34] David: First, I'd check our status page to see if there are any known AWS outages. Then I'd look at our main dashboard to identify what's actually failing - is it network, compute, database?

[04:50] David: I'd check if recent deployments might be the cause - ArgoCD makes that easy to see. If so, rolling back is the fastest fix while we investigate.

[05:04] David: If it's not deployment-related, I'd start looking at resource utilization - are we hitting CPU or memory limits? Are pods crashing? Are there pending pods that can't be scheduled?

[05:20] David: Then I'd dive into logs for the affected services, look at traces if it's a latency issue, and check database connections and query performance.

[05:35] David: Throughout, I'd be communicating in our incident channel - what I'm seeing, what I'm trying, what I've ruled out. Even if I'm the only one awake, that documentation is valuable.

[05:50] Alex: Good process. One last technical question - we use Terraform heavily for infrastructure as code. What's your experience there?

[06:00] David: Honestly, that's an area where I have less depth. We used CloudFormation at my current company because we're an AWS shop. I've done some Terraform for personal projects and I understand the concepts - state management, providers, modules - but I haven't used it at production scale.

[06:24] David: That said, infrastructure as code is infrastructure as code - the patterns are similar. I'm confident I could ramp up quickly.

[06:34] Alex: Fair enough. We all have areas to grow. Let me tell you a bit more about what we're working on...

... [interview continues] ...

[42:00] Alex: Alright David, I think we're at time. Any questions for me?

[42:06] David: Yeah, what's the biggest infrastructure challenge you're facing right now?

[42:12] Alex: Multi-region. We're US-only right now but expanding to Europe. GDPR compliance, data residency, latency - lots of interesting problems. It would be a big part of this role.

[42:30] David: That sounds really exciting. I haven't done multi-region before but I've thought about the patterns a lot. I'd love to be part of solving that.

[42:40] Alex: Great! Well, thanks for your time David. You'll hear from us soon about next steps.

[42:48] David: Thanks Alex, really enjoyed the conversation!`,
    createdAt: '2024-01-26T10:00:00Z',
    updatedAt: '2024-01-26T10:00:00Z'
  },
  {
    id: 'note_004',
    candidateId: 'cand_002',
    applicationId: 'app_002',
    jobId: 'job_002',
    type: 'phone_screen',
    title: 'Phone Screen - Michael Rodriguez',
    interviewers: ['Lisa Park'],
    interviewDate: '2024-01-19T11:00:00Z',
    duration: 28,
    summary: 'Strong product background with B2B SaaS experience at Stripe and Notion. Articulate about product strategy and data-driven decision making. Has managed products with $10M+ ARR. Interested in the role but has competing offers. Need to move quickly.',
    rating: 4,
    recommendation: 'hire',
    highlights: [
      'Led product that grew from $2M to $10M ARR',
      'Strong data skills - can write SQL, familiar with analytics tools',
      'Experience with both 0-to-1 and scaling existing products',
      'Great stakeholder management examples'
    ],
    concerns: [
      'Has competing offers - may need to accelerate timeline',
      'Salary expectations at top of our range'
    ],
    source: 'manual',
    createdAt: '2024-01-19T12:00:00Z',
    updatedAt: '2024-01-19T12:00:00Z'
  },
  {
    id: 'note_005',
    candidateId: 'cand_005',
    applicationId: 'app_005',
    jobId: 'job_004',
    type: 'phone_screen',
    title: 'Initial Screen - Jessica Williams',
    interviewers: ['Tom Chen'],
    interviewDate: '2024-01-24T15:00:00Z',
    duration: 35,
    summary: 'PhD candidate with impressive ML background. Published papers in top venues (NeurIPS, ICML). Currently finishing dissertation on large language models. Strong theoretical foundation but needs to assess practical production experience. Very enthusiastic about the role.',
    rating: 4,
    recommendation: 'hire',
    highlights: [
      '3 papers in top ML conferences',
      'Internship experience at Google Research',
      'Strong mathematical and statistical foundation',
      'Passionate about applying ML to real problems'
    ],
    concerns: [
      'Limited production ML experience',
      'May need support on engineering practices (code review, testing, etc.)',
      'PhD completion timeline unclear (says 2-3 months)'
    ],
    source: 'otter',
    createdAt: '2024-01-24T16:00:00Z',
    updatedAt: '2024-01-24T16:00:00Z'
  }
];
