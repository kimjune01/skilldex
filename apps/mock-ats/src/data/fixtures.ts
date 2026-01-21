import type { Candidate, Job, Application } from '@skillomatic/shared';

export const candidates: Candidate[] = [
  {
    id: 'cand_001',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@email.com',
    phone: '+1-555-0101',
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
