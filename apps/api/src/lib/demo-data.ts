/**
 * Demo mode data generator
 * Provides realistic mock data for demos and testing
 */

// Demo candidates with realistic recruiting data
export function generateDemoCandidates() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 'demo-cand-1',
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@example.com',
      phone: '+1 (415) 555-0123',
      title: 'Senior Software Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      skills: ['Python', 'Go', 'Kubernetes', 'PostgreSQL', 'AWS'],
      experience: 7,
      source: 'LinkedIn',
      status: 'active',
      stage: 'Interview',
      notes: 'Strong backend experience. 2nd round scheduled for Friday.',
      createdAt: today,
      updatedAt: today,
    },
    {
      id: 'demo-cand-2',
      firstName: 'Marcus',
      lastName: 'Johnson',
      email: 'marcus.j@example.com',
      phone: '+1 (650) 555-0456',
      title: 'Staff Engineer',
      company: 'Meta',
      location: 'Menlo Park, CA',
      linkedinUrl: 'https://linkedin.com/in/marcusjohnson',
      skills: ['React', 'TypeScript', 'GraphQL', 'Node.js', 'System Design'],
      experience: 10,
      source: 'Referral',
      status: 'active',
      stage: 'Offer',
      notes: 'Excellent systems background. Verbal offer extended, awaiting response.',
      createdAt: twoDaysAgo,
      updatedAt: today,
    },
    {
      id: 'demo-cand-3',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rod@example.com',
      phone: '+1 (510) 555-0789',
      title: 'Engineering Manager',
      company: 'Airbnb',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
      skills: ['Leadership', 'Agile', 'Python', 'Microservices', 'Team Building'],
      experience: 12,
      source: 'LinkedIn',
      status: 'active',
      stage: 'Screening',
      notes: 'Looking for IC to manager transition candidates. Strong technical background.',
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: 'demo-cand-4',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@example.com',
      phone: '+1 (408) 555-0321',
      title: 'Backend Developer',
      company: 'Uber',
      location: 'San Jose, CA',
      linkedinUrl: 'https://linkedin.com/in/davidkim',
      skills: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Docker'],
      experience: 5,
      source: 'Job Board',
      status: 'active',
      stage: 'New',
      notes: 'Applied through careers page. Resume looks promising.',
      createdAt: today,
      updatedAt: today,
    },
    {
      id: 'demo-cand-5',
      firstName: 'Lisa',
      lastName: 'Wang',
      email: 'lisa.wang@example.com',
      phone: '+1 (925) 555-0654',
      title: 'Full Stack Developer',
      company: 'Salesforce',
      location: 'Remote',
      linkedinUrl: 'https://linkedin.com/in/lisawang',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
      experience: 4,
      source: 'LinkedIn',
      status: 'active',
      stage: 'Interview',
      notes: 'Good culture fit. Technical screen went well.',
      createdAt: threeDaysAgo,
      updatedAt: yesterday,
    },
    {
      id: 'demo-cand-6',
      firstName: 'Alex',
      lastName: 'Thompson',
      email: 'alex.t@example.com',
      phone: '+1 (415) 555-0987',
      title: 'DevOps Engineer',
      company: 'Netflix',
      location: 'Los Gatos, CA',
      linkedinUrl: 'https://linkedin.com/in/alexthompson',
      skills: ['Terraform', 'AWS', 'Kubernetes', 'CI/CD', 'Python'],
      experience: 6,
      source: 'Referral',
      status: 'active',
      stage: 'Screening',
      notes: 'Referred by current team member. Strong DevOps background.',
      createdAt: today,
      updatedAt: today,
    },
    {
      id: 'demo-cand-7',
      firstName: 'Rachel',
      lastName: 'Martinez',
      email: 'rachel.m@example.com',
      phone: '+1 (650) 555-0147',
      title: 'Data Engineer',
      company: 'Databricks',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/rachelmartinez',
      skills: ['Spark', 'Python', 'SQL', 'Airflow', 'Snowflake'],
      experience: 5,
      source: 'LinkedIn',
      status: 'rejected',
      stage: 'Rejected',
      notes: 'Good skills but looking for more senior role than we have open.',
      createdAt: lastWeek,
      updatedAt: twoDaysAgo,
    },
    {
      id: 'demo-cand-8',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.w@example.com',
      phone: '+1 (510) 555-0258',
      title: 'Senior Frontend Engineer',
      company: 'Twitter',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/jameswilson',
      skills: ['React', 'TypeScript', 'CSS', 'Performance', 'Accessibility'],
      experience: 8,
      source: 'LinkedIn',
      status: 'hired',
      stage: 'Hired',
      notes: 'Accepted offer! Start date: Next Monday.',
      createdAt: lastWeek,
      updatedAt: yesterday,
    },
  ];
}

// Demo jobs/requisitions
export function generateDemoJobs() {
  return [
    {
      id: 'demo-job-1',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'open',
      description: 'Looking for a senior engineer to join our platform team.',
      requirements: ['5+ years experience', 'Python or Go', 'Distributed systems'],
      salary: { min: 180000, max: 220000 },
      hiringManager: 'Jane Smith',
      openings: 2,
      applicants: 15,
      createdAt: '2024-01-01',
    },
    {
      id: 'demo-job-2',
      title: 'Engineering Manager',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'open',
      description: 'Seeking an experienced engineering manager for our growth team.',
      requirements: ['8+ years experience', '3+ years management', 'Technical background'],
      salary: { min: 220000, max: 280000 },
      hiringManager: 'Bob Johnson',
      openings: 1,
      applicants: 8,
      createdAt: '2024-01-10',
    },
    {
      id: 'demo-job-3',
      title: 'Frontend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'open',
      description: 'Join our frontend team to build amazing user experiences.',
      requirements: ['3+ years experience', 'React', 'TypeScript'],
      salary: { min: 140000, max: 180000 },
      hiringManager: 'Jane Smith',
      openings: 3,
      applicants: 22,
      createdAt: '2024-01-15',
    },
    {
      id: 'demo-job-4',
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'open',
      description: 'Help us scale our infrastructure and improve developer experience.',
      requirements: ['4+ years experience', 'Kubernetes', 'Terraform', 'AWS'],
      salary: { min: 160000, max: 200000 },
      hiringManager: 'Mike Chen',
      openings: 1,
      applicants: 10,
      createdAt: '2024-01-20',
    },
  ];
}

// Demo applications (candidate-job associations with pipeline status)
export function generateDemoApplications() {
  const now = new Date();
  const today = now.toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-app-1',
      candidateId: 'demo-cand-1',
      jobId: 'demo-job-1',
      stage: 'Interview',
      stageHistory: [
        { stage: 'New', date: twoDaysAgo },
        { stage: 'Screening', date: yesterday },
        { stage: 'Interview', date: today },
      ],
      appliedAt: twoDaysAgo,
      updatedAt: today,
    },
    {
      id: 'demo-app-2',
      candidateId: 'demo-cand-2',
      jobId: 'demo-job-1',
      stage: 'Offer',
      stageHistory: [
        { stage: 'New', date: '2024-01-10' },
        { stage: 'Screening', date: '2024-01-12' },
        { stage: 'Interview', date: '2024-01-15' },
        { stage: 'Offer', date: yesterday },
      ],
      appliedAt: '2024-01-10',
      updatedAt: yesterday,
    },
    {
      id: 'demo-app-3',
      candidateId: 'demo-cand-3',
      jobId: 'demo-job-2',
      stage: 'Screening',
      stageHistory: [
        { stage: 'New', date: yesterday },
        { stage: 'Screening', date: today },
      ],
      appliedAt: yesterday,
      updatedAt: today,
    },
    {
      id: 'demo-app-4',
      candidateId: 'demo-cand-4',
      jobId: 'demo-job-1',
      stage: 'New',
      stageHistory: [
        { stage: 'New', date: today },
      ],
      appliedAt: today,
      updatedAt: today,
    },
    {
      id: 'demo-app-5',
      candidateId: 'demo-cand-5',
      jobId: 'demo-job-3',
      stage: 'Interview',
      stageHistory: [
        { stage: 'New', date: '2024-01-18' },
        { stage: 'Screening', date: '2024-01-19' },
        { stage: 'Interview', date: yesterday },
      ],
      appliedAt: '2024-01-18',
      updatedAt: yesterday,
    },
    {
      id: 'demo-app-6',
      candidateId: 'demo-cand-6',
      jobId: 'demo-job-4',
      stage: 'Screening',
      stageHistory: [
        { stage: 'New', date: today },
        { stage: 'Screening', date: today },
      ],
      appliedAt: today,
      updatedAt: today,
    },
    {
      id: 'demo-app-7',
      candidateId: 'demo-cand-8',
      jobId: 'demo-job-3',
      stage: 'Hired',
      stageHistory: [
        { stage: 'New', date: '2024-01-08' },
        { stage: 'Screening', date: '2024-01-10' },
        { stage: 'Interview', date: '2024-01-12' },
        { stage: 'Offer', date: '2024-01-16' },
        { stage: 'Hired', date: yesterday },
      ],
      appliedAt: '2024-01-08',
      updatedAt: yesterday,
    },
  ];
}

// Demo usage logs for analytics
export function generateDemoUsageLogs(userId: string) {
  const now = new Date();
  const logs = [];
  const skills = [
    { id: 'skill-ats-candidate-search', slug: 'ats-candidate-search' },
    { id: 'skill-linkedin-lookup', slug: 'linkedin-lookup' },
    { id: 'skill-ats-candidate-crud', slug: 'ats-candidate-crud' },
    { id: 'skill-daily-report', slug: 'daily-report' },
  ];

  // Generate logs for the past 7 days
  for (let day = 0; day < 7; day++) {
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    const logsPerDay = Math.floor(Math.random() * 8) + 3; // 3-10 logs per day

    for (let i = 0; i < logsPerDay; i++) {
      const skill = skills[Math.floor(Math.random() * skills.length)];
      const isSuccess = Math.random() > 0.1; // 90% success rate

      logs.push({
        id: `demo-log-${day}-${i}`,
        skillId: skill.id,
        skillSlug: skill.slug,
        userId,
        apiKeyId: 'demo-api-key',
        status: isSuccess ? 'success' : 'error',
        durationMs: Math.floor(Math.random() * 2000) + 500,
        errorMessage: isSuccess ? null : 'Demo error message',
        createdAt: date.toISOString(),
      });
    }
  }

  return logs;
}

// Check if demo mode is enabled
export function isDemoMode(request: Request): boolean {
  // Check header first
  const demoHeader = request.headers.get('X-Demo-Mode');
  if (demoHeader === 'true' || demoHeader === '1') {
    return true;
  }

  // Check query param
  const url = new URL(request.url);
  const demoParam = url.searchParams.get('demo');
  if (demoParam === 'true' || demoParam === '1') {
    return true;
  }

  return false;
}
