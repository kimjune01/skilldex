/**
 * Zoho Recruit API Client
 *
 * Maps Zoho Recruit API v2 to Skillomatic's unified ATS types.
 *
 * @see https://www.zoho.com/recruit/developer-guide/apiv2/
 */

import type {
  Candidate,
  Job,
  Application,
  CandidateSource,
  ApplicationStatus,
  JobStatus,
  EmploymentType,
} from '@skillomatic/shared';

// Zoho Recruit API base URL (US region - adjust for EU/CN if needed)
const ZOHO_RECRUIT_BASE_URL = 'https://recruit.zoho.com/recruit/v2';

// Zoho API response types
interface ZohoRecord {
  id: string;
  [key: string]: unknown;
}

interface ZohoListResponse<T> {
  data: T[];
  info: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

interface ZohoCandidate extends ZohoRecord {
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Current_Job_Title?: string;
  Current_Employer?: string;
  City?: string;
  State?: string;
  Country?: string;
  Skill_Set?: string;
  Source?: string;
  Source_Name?: string;
  Created_Time?: string;
  Modified_Time?: string;
  $approved?: boolean;
}

interface ZohoJobOpening extends ZohoRecord {
  Posting_Title?: string;
  Job_Opening_Name?: string;
  Department_Name?: string;
  City?: string;
  State?: string;
  Country?: string;
  Job_Type?: string;
  Job_Description?: string;
  Required_Skills?: string;
  Job_Opening_Status?: string;
  Date_Opened?: string;
  Target_Date?: string;
  Hiring_Manager?: { name?: string; id?: string };
  Recruiter?: { name?: string; id?: string };
  Created_Time?: string;
  Modified_Time?: string;
  Number_of_Positions?: number;
  Salary?: string;
  Min_Salary?: number;
  Max_Salary?: number;
}

interface ZohoApplication extends ZohoRecord {
  Candidate_ID?: { name?: string; id?: string };
  Job_Opening_ID?: { name?: string; id?: string };
  Candidate_Status?: string;
  Stage?: string;
  Applied_Date?: string;
  Rejected_Date?: string;
  Rejection_Reason?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export class ZohoRecruitClient {
  private accessToken: string;
  private baseUrl: string;

  constructor(accessToken: string, region: 'us' | 'eu' | 'cn' = 'us') {
    this.accessToken = accessToken;
    this.baseUrl = this.getBaseUrl(region);
  }

  private getBaseUrl(region: 'us' | 'eu' | 'cn'): string {
    switch (region) {
      case 'eu':
        return 'https://recruit.zoho.eu/recruit/v2';
      case 'cn':
        return 'https://recruit.zoho.com.cn/recruit/v2';
      default:
        return ZOHO_RECRUIT_BASE_URL;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        error.message || error.code || `Zoho API error: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  // ============ Candidates ============

  async getCandidates(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ candidates: Candidate[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.perPage) queryParams.set('per_page', String(params.perPage));
    if (params?.sortBy) queryParams.set('sort_by', params.sortBy);
    if (params?.sortOrder) queryParams.set('sort_order', params.sortOrder);

    let endpoint = '/Candidates';
    if (params?.search) {
      // Use search endpoint for text search
      endpoint = '/Candidates/search';
      queryParams.set(
        'criteria',
        `((First_Name:contains:${params.search})or(Last_Name:contains:${params.search})or(Email:contains:${params.search}))`
      );
    }

    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;

    try {
      const response = await this.request<ZohoListResponse<ZohoCandidate>>(url);
      return {
        candidates: response.data.map(this.mapCandidate),
        total: response.info.count,
        hasMore: response.info.more_records,
      };
    } catch (error) {
      // Handle empty results (Zoho returns error for no results)
      if (
        error instanceof Error &&
        error.message.includes('no matching record')
      ) {
        return { candidates: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    try {
      const response = await this.request<{ data: ZohoCandidate[] }>(
        `/Candidates/${id}`
      );
      if (response.data.length === 0) return null;
      return this.mapCandidate(response.data[0]);
    } catch {
      return null;
    }
  }

  async createCandidate(
    candidate: Partial<Candidate>
  ): Promise<Candidate | null> {
    const zohoData = {
      data: [
        {
          First_Name: candidate.firstName,
          Last_Name: candidate.lastName,
          Email: candidate.email,
          Phone: candidate.phone,
          Current_Job_Title: candidate.headline,
          City: candidate.location?.city,
          State: candidate.location?.state,
          Country: candidate.location?.country,
          Source: this.mapSourceToZoho(candidate.source),
        },
      ],
    };

    const response = await this.request<{
      data: Array<{ details: ZohoCandidate; code: string }>;
    }>('/Candidates', {
      method: 'POST',
      body: JSON.stringify(zohoData),
    });

    if (response.data[0]?.code === 'SUCCESS') {
      return this.mapCandidate(response.data[0].details);
    }
    return null;
  }

  async updateCandidate(
    id: string,
    updates: Partial<Candidate>
  ): Promise<Candidate | null> {
    const zohoData = {
      data: [
        {
          id,
          First_Name: updates.firstName,
          Last_Name: updates.lastName,
          Email: updates.email,
          Phone: updates.phone,
          Current_Job_Title: updates.headline,
          City: updates.location?.city,
          State: updates.location?.state,
          Country: updates.location?.country,
        },
      ],
    };

    const response = await this.request<{
      data: Array<{ details: ZohoCandidate; code: string }>;
    }>('/Candidates', {
      method: 'PUT',
      body: JSON.stringify(zohoData),
    });

    if (response.data[0]?.code === 'SUCCESS') {
      return this.getCandidate(id);
    }
    return null;
  }

  private mapCandidate(zoho: ZohoCandidate): Candidate {
    return {
      id: zoho.id,
      firstName: zoho.First_Name || '',
      lastName: zoho.Last_Name || '',
      email: zoho.Email || '',
      phone: zoho.Phone || zoho.Mobile,
      headline: zoho.Current_Job_Title,
      summary: undefined,
      location:
        zoho.City || zoho.Country
          ? {
              city: zoho.City || '',
              state: zoho.State,
              country: zoho.Country || '',
            }
          : undefined,
      source: this.mapSource(zoho.Source),
      sourceDetail: zoho.Source_Name,
      attachments: [], // Zoho attachments require separate API call
      tags: zoho.Skill_Set ? zoho.Skill_Set.split(',').map((s) => s.trim()) : [],
      createdAt: zoho.Created_Time || new Date().toISOString(),
      updatedAt: zoho.Modified_Time || new Date().toISOString(),
    };
  }

  private mapSource(zohoSource?: string): CandidateSource {
    const source = zohoSource?.toLowerCase() || '';
    if (source.includes('referral')) return 'referral';
    if (source.includes('agency') || source.includes('recruiter'))
      return 'agency';
    if (source.includes('sourced') || source.includes('linkedin'))
      return 'sourced';
    return 'applied';
  }

  private mapSourceToZoho(source?: CandidateSource): string {
    switch (source) {
      case 'referral':
        return 'Employee Referral';
      case 'agency':
        return 'External Referral';
      case 'sourced':
        return 'LinkedIn';
      default:
        return 'Career Site';
    }
  }

  // ============ Jobs ============

  async getJobs(params?: {
    page?: number;
    perPage?: number;
    status?: string;
  }): Promise<{ jobs: Job[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.perPage) queryParams.set('per_page', String(params.perPage));

    let endpoint = '/Job_Openings';
    if (params?.status) {
      endpoint = '/Job_Openings/search';
      queryParams.set('criteria', `(Job_Opening_Status:equals:${params.status})`);
    }

    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;

    try {
      const response = await this.request<ZohoListResponse<ZohoJobOpening>>(url);
      return {
        jobs: response.data.map(this.mapJob.bind(this)),
        total: response.info.count,
        hasMore: response.info.more_records,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('no matching record')
      ) {
        return { jobs: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }

  async getJob(id: string): Promise<Job | null> {
    try {
      const response = await this.request<{ data: ZohoJobOpening[] }>(
        `/Job_Openings/${id}`
      );
      if (response.data.length === 0) return null;
      return this.mapJob(response.data[0]);
    } catch {
      return null;
    }
  }

  private mapJob(zoho: ZohoJobOpening): Job {
    const location = [zoho.City, zoho.State, zoho.Country]
      .filter(Boolean)
      .join(', ');

    return {
      id: zoho.id,
      title: zoho.Posting_Title || zoho.Job_Opening_Name || '',
      department: zoho.Department_Name || '',
      location: location || 'Remote',
      employmentType: this.mapEmploymentType(zoho.Job_Type),
      description: zoho.Job_Description || '',
      requirements: zoho.Required_Skills
        ? zoho.Required_Skills.split(',').map((s) => s.trim())
        : [],
      niceToHave: [],
      salary:
        zoho.Min_Salary || zoho.Max_Salary
          ? {
              min: zoho.Min_Salary || 0,
              max: zoho.Max_Salary || 0,
              currency: 'USD',
            }
          : undefined,
      status: this.mapJobStatus(zoho.Job_Opening_Status),
      hiringManagerId: zoho.Hiring_Manager?.id || '',
      recruiterId: zoho.Recruiter?.id || '',
      openDate: zoho.Date_Opened || zoho.Created_Time || new Date().toISOString(),
      closeDate: zoho.Target_Date,
      createdAt: zoho.Created_Time || new Date().toISOString(),
      updatedAt: zoho.Modified_Time || new Date().toISOString(),
    };
  }

  private mapEmploymentType(zohoType?: string): EmploymentType {
    const type = zohoType?.toLowerCase() || '';
    if (type.includes('part')) return 'part-time';
    if (type.includes('contract') || type.includes('temp')) return 'contract';
    if (type.includes('intern')) return 'intern';
    return 'full-time';
  }

  private mapJobStatus(zohoStatus?: string): JobStatus {
    const status = zohoStatus?.toLowerCase() || '';
    if (status.includes('closed') || status.includes('cancelled'))
      return 'closed';
    if (status.includes('hold') || status.includes('paused')) return 'on-hold';
    if (status.includes('filled')) return 'filled';
    return 'open';
  }

  // ============ Applications ============

  async getApplications(params?: {
    candidateId?: string;
    jobId?: string;
    page?: number;
    perPage?: number;
  }): Promise<{
    applications: Application[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.perPage) queryParams.set('per_page', String(params.perPage));

    // Zoho uses "Candidates" module with associated Job_Opening for applications
    // We need to use the Associated Records API or filter
    let endpoint = '/Candidates';

    if (params?.candidateId) {
      // Get applications for a specific candidate
      endpoint = `/Candidates/${params.candidateId}/Job_Openings`;
    } else if (params?.jobId) {
      // Get applications for a specific job
      endpoint = `/Job_Openings/${params.jobId}/Candidates`;
    }

    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;

    try {
      const response = await this.request<ZohoListResponse<ZohoApplication>>(
        url
      );
      return {
        applications: response.data.map(this.mapApplication.bind(this)),
        total: response.info.count,
        hasMore: response.info.more_records,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('no matching record')
      ) {
        return { applications: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }

  async updateApplicationStage(
    applicationId: string,
    stage: string
  ): Promise<Application | null> {
    // Zoho uses Candidate_Status field for stage
    const zohoData = {
      data: [
        {
          id: applicationId,
          Candidate_Status: stage,
        },
      ],
    };

    try {
      await this.request('/Candidates', {
        method: 'PUT',
        body: JSON.stringify(zohoData),
      });
      // Return updated application - would need to fetch it
      return null;
    } catch {
      return null;
    }
  }

  private mapApplication(zoho: ZohoApplication): Application {
    return {
      id: zoho.id,
      candidateId: zoho.Candidate_ID?.id || zoho.id,
      jobId: zoho.Job_Opening_ID?.id || '',
      status: this.mapApplicationStatus(zoho.Candidate_Status),
      stage: zoho.Stage || zoho.Candidate_Status || 'New',
      stageHistory: [],
      appliedAt: zoho.Applied_Date || zoho.Created_Time || new Date().toISOString(),
      rejectedAt: zoho.Rejected_Date,
      rejectionReason: zoho.Rejection_Reason,
      createdAt: zoho.Created_Time || new Date().toISOString(),
      updatedAt: zoho.Modified_Time || new Date().toISOString(),
    };
  }

  private mapApplicationStatus(zohoStatus?: string): ApplicationStatus {
    const status = zohoStatus?.toLowerCase() || '';
    if (status.includes('new') || status.includes('received')) return 'new';
    if (status.includes('screen')) return 'screening';
    if (status.includes('interview')) return 'interview';
    if (status.includes('offer')) return 'offer';
    if (status.includes('hired') || status.includes('joined')) return 'hired';
    if (status.includes('reject')) return 'rejected';
    return 'new';
  }
}
