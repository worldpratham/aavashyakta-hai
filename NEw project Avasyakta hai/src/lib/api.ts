function getApiBaseUrl(): string {
  // When running in the browser on a deployed domain (mobile, Vercel, or custom domain)
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      // In production/mobile, only use VITE_API_URL if it points to an external remote server (not localhost)
      const customUrl = import.meta.env.VITE_API_URL as string | undefined;
      if (customUrl && !customUrl.includes('localhost') && !customUrl.includes('127.0.0.1')) {
        return customUrl;
      }
      return '/api';
    }
  }

  return (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
}

const API_BASE_URL = getApiBaseUrl();

export { API_BASE_URL };

export type Role = 'employer' | 'worker' | 'admin';

export function isAdminUser(profile?: Profile | null): boolean {
  if (!profile) return false;
  return (
    profile.role === 'admin' ||
    (Boolean(profile.email) && profile.email?.toLowerCase() === 'manager@gmail.com')
  );
}

export type WageType = 'task' | 'daily' | 'weekly' | 'monthly' | 'fixed';

export interface Profile {
  id: string;
  _id?: string;
  full_name: string;
  name?: string;
  email?: string;
  role: Role;
  phone: string | null;
  bio: string | null;
  skills: string | null;
  primary_skill?: string | null;
  experience_level?: string | null;
  company_name?: string | null;
  company_type?: string | null;
  gst_or_id?: string | null;
  is_verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified';
  verification_badge?: 'unverified' | 'phone_verified' | 'verified_worker';
  location: string | null;
  avatar_url: string | null;
  profileImage?: string | null;
  aadhaar_number?: string | null;
  aadhaar_verified?: boolean;
  bank_details?: {
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
  } | null;
  payment_mode?: string | null;
  upi_id?: string | null;
  terms_accepted?: boolean;
  is_available_now?: boolean;
  available_status_text?: string | null;
  available_updated_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  _id?: string;
  employer_id: string;
  employerId?: any;
  title: string;
  description: string;
  category: string;
  location: string | null;
  address?: string | null;
  job?: string | null;
  task_details?: string | null;
  taskDetails?: string | null;
  wage: string | number | null;
  wage_type: WageType | null;
  wageType?: WageType | null;
  phone: string | null;
  status: 'open' | 'closed' | 'active';
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  createdAt?: string;
  employer?: {
    full_name: string;
    location: string | null;
    phone: string | null;
    avatar_url: string | null;
    company_name?: string | null;
    company_type?: string | null;
    is_verified?: boolean;
    verification_status?: string;
  };
}

export interface Application {
  id: string;
  _id?: string;
  job_id: string;
  jobId?: any;
  worker_id: string;
  workerId?: any;
  message: string | null;
  expected_wage: number | null;
  expectedWage?: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'hired' | 'completed' | 'paid';
  payment_mode?: 'upi' | 'bank_transfer' | 'cash' | string | null;
  paymentMode?: string | null;
  upi_id?: string | null;
  upiId?: string | null;
  bank_details?: {
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
  } | null;
  bankDetails?: {
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
  } | null;
  created_at: string;
  createdAt?: string;

  job?: Pick<Job, 'id' | 'title' | 'category' | 'location' | 'status' | 'wage' | 'wage_type'>;
  worker?: {
    id: string;
    full_name: string;
    phone: string | null;
    skills: string | null;
    primary_skill?: string | null;
    experience_level?: string | null;
    is_verified?: boolean;
    verification_badge?: string;
    location: string | null;
    avatar_url: string | null;
    bank_details?: {
      account_holder_name?: string;
      account_number?: string;
      ifsc_code?: string;
      bank_name?: string;
    } | null;
    payment_mode?: string | null;
    upi_id?: string | null;
  };
}

export const JOB_CATEGORIES = [
  'Delivery',
  'Driver',
  'Warehouse / Logistics',
  'Manufacturing',
  'Peon',
  'Housekeeping',
  'Security Guard',
  'Painter',
  'Labour / Helper',
  'Technician',
  'Cook',
  'Retail',
  'Electrician',
  'Plumber',
  'Office Work',
  'Construction',
  'Domestic Help',
  'Other',
] as const;

export const WAGE_TYPES: { value: WageType; label: string }[] = [
  { value: 'task', label: 'Per task' },
  { value: 'daily', label: 'Per day' },
  { value: 'weekly', label: 'Per week' },
  { value: 'monthly', label: 'Per month' },
  { value: 'fixed', label: 'Fixed amount' },
];

export function getAuthToken(): string {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('abasyakta_token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function normalizeProfile(data: any): Profile {
  if (!data) return {} as Profile;
  const id = data._id || data.id || '';
  const fullName = data.full_name || data.name || 'User';
  let skillsStr = data.skills;
  if (Array.isArray(data.skills)) {
    skillsStr = data.skills.join(', ');
  }

  return {
    id,
    _id: id,
    full_name: fullName,
    name: fullName,
    email: data.email || '',
    role: data.role || 'worker',
    phone: data.phone || null,
    bio: data.bio || null,
    skills: skillsStr || null,
    primary_skill: data.primary_skill || null,
    experience_level: data.experience_level || null,
    company_name: data.company_name || null,
    company_type: data.company_type || null,
    gst_or_id: data.gst_or_id || null,
    is_verified: data.is_verified ?? true,
    verification_status: data.verification_status || 'verified',
    verification_badge: data.verification_badge || 'verified_worker',
    location: data.location || null,
    avatar_url: data.avatar_url || data.profileImage || null,
    profileImage: data.profileImage || data.avatar_url || null,
    aadhaar_number: data.aadhaar_number || null,
    aadhaar_verified: data.aadhaar_verified ?? false,
    bank_details: data.bank_details || null,
    payment_mode: data.payment_mode || null,
    upi_id: data.upi_id || null,
    terms_accepted: data.terms_accepted ?? false,
    is_available_now: data.is_available_now ?? false,
    available_status_text: data.available_status_text || null,
    available_updated_at: data.available_updated_at || null,
    latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
    longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
  };
}

export function normalizeJob(data: any): Job {
  if (!data) return {} as Job;
  const id = data._id || data.id || '';
  const employerObj =
    typeof data.employer === 'object'
      ? data.employer
      : typeof data.employer_id === 'object'
      ? data.employer_id
      : typeof data.employerId === 'object'
      ? data.employerId
      : null;

  const employerIdStr =
    typeof data.employer_id === 'string'
      ? data.employer_id
      : typeof data.employerId === 'string'
      ? data.employerId
      : employerObj?._id || employerObj?.id || '';

  const wageType = (data.wage_type || data.wageType || 'daily') as WageType;
  const status = (data.status === 'active' ? 'open' : data.status || 'open') as 'open' | 'closed';

  return {
    id,
    _id: id,
    employer_id: employerIdStr,
    employerId: employerIdStr,
    title: data.title || '',
    description: data.description || '',
    category: data.category || 'Other',
    location: data.location || null,
    address: data.address || null,
    job: data.job || null,
    task_details: data.task_details || data.taskDetails || null,
    taskDetails: data.taskDetails || data.task_details || null,
    wage: data.wage ? String(data.wage) : null,
    wage_type: wageType,
    wageType: wageType,
    phone: data.phone || null,
    status,
    latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
    longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    employer: employerObj
      ? {
          full_name: employerObj.full_name || employerObj.name || 'Employer',
          location: employerObj.location || null,
          phone: employerObj.phone || null,
          avatar_url: employerObj.avatar_url || employerObj.profileImage || null,
          company_name: employerObj.company_name || null,
          company_type: employerObj.company_type || null,
          is_verified: employerObj.is_verified ?? true,
          verification_status: employerObj.verification_status || 'verified',
        }
      : undefined,
  };
}

export function normalizeApplication(data: any): Application {
  if (!data) return {} as Application;
  const id = data._id || data.id || '';

  const jobObj =
    typeof data.job === 'object'
      ? data.job
      : typeof data.job_id === 'object'
      ? data.job_id
      : typeof data.jobId === 'object'
      ? data.jobId
      : null;

  const workerObj =
    typeof data.worker === 'object'
      ? data.worker
      : typeof data.worker_id === 'object'
      ? data.worker_id
      : typeof data.workerId === 'object'
      ? data.workerId
      : null;

  const jobIdStr =
    typeof data.job_id === 'string'
      ? data.job_id
      : typeof data.jobId === 'string'
      ? data.jobId
      : jobObj?._id || jobObj?.id || '';

  const workerIdStr =
    typeof data.worker_id === 'string'
      ? data.worker_id
      : typeof data.workerId === 'string'
      ? data.workerId
      : workerObj?._id || workerObj?.id || '';

  return {
    id,
    _id: id,
    job_id: jobIdStr,
    jobId: jobIdStr,
    worker_id: workerIdStr,
    workerId: workerIdStr,
    message: data.message || null,
    expected_wage: data.expected_wage ?? data.expectedWage ?? null,
    expectedWage: data.expectedWage ?? data.expected_wage ?? null,
    payment_mode:
      data.payment_mode ||
      data.paymentMode ||
      workerObj?.payment_mode ||
      null,
    paymentMode:
      data.payment_mode ||
      data.paymentMode ||
      workerObj?.payment_mode ||
      null,
    upi_id: data.upi_id || data.upiId || workerObj?.upi_id || null,
    upiId: data.upi_id || data.upiId || workerObj?.upi_id || null,
    bank_details:
      data.bank_details ||
      data.bankDetails ||
      workerObj?.bank_details ||
      null,
    bankDetails:
      data.bank_details ||
      data.bankDetails ||
      workerObj?.bank_details ||
      null,
    status: (data.status || 'pending') as
      | 'pending'
      | 'accepted'
      | 'rejected'
      | 'hired'
      | 'completed'
      | 'paid',
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    job: jobObj
      ? {
          id: jobObj._id || jobObj.id || jobIdStr,
          title: jobObj.title || 'Untitled Job',
          category: jobObj.category || 'General',
          location: jobObj.location || null,
          status: jobObj.status || 'open',
          wage: jobObj.wage ? String(jobObj.wage) : null,
          wage_type: jobObj.wage_type || jobObj.wageType || 'daily',
        }
      : undefined,
    worker: workerObj
      ? {
          id: workerObj._id || workerObj.id || workerIdStr,
          full_name: workerObj.full_name || workerObj.name || 'Worker',
          phone: workerObj.phone || null,
          skills: Array.isArray(workerObj.skills) ? workerObj.skills.join(', ') : workerObj.skills || null,
          primary_skill: workerObj.primary_skill || null,
          experience_level: workerObj.experience_level || null,
          is_verified: workerObj.is_verified ?? true,
          verification_badge: workerObj.verification_badge || 'verified_worker',
          location: workerObj.location || null,
          avatar_url: workerObj.avatar_url || workerObj.profileImage || null,
          bank_details: workerObj.bank_details || null,
          payment_mode: workerObj.payment_mode || null,
          upi_id: workerObj.upi_id || null,
        }
      : undefined,
  };
}

// ======================================================
// API CLIENT
// ======================================================

export const api = {
  jobs: {
    async getAll(): Promise<Job[]> {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.jobs || [];
      return list.map(normalizeJob);
    },

    async getStats(): Promise<{
      success: boolean;
      totalJobs: number;
      byCategory: { _id: string; count: number; appliedCount?: number }[];
      byCity: { _id: string; count: number }[];
    }> {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
      } catch (err) {
        return { success: false, totalJobs: 0, byCategory: [], byCity: [] };
      }
    },


    async getById(id: string): Promise<Job> {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
      if (!response.ok) {
        throw new Error('Job not found');
      }
      const data = await response.json();
      return normalizeJob(data);
    },

    async getByEmployer(employerId: string): Promise<Job[]> {
      const response = await fetch(`${API_BASE_URL}/jobs/employer/${employerId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employer jobs');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.jobs || [];
      return list.map(normalizeJob);
    },

    async create(payload: {
      title: string;
      description: string;
      category: string;
      location?: string;
      address?: string;
      job?: string;
      taskDetails?: string;
      wage?: number | string;
      wageType?: WageType;
      phone?: string;
      latitude?: number | null;
      longitude?: number | null;
    }): Promise<Job> {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to create job');
      }
      return normalizeJob(data);
    },

    async update(id: string, payload: Partial<Job>): Promise<Job> {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to update job');
      }
      return normalizeJob(data);
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.error || 'Failed to delete job');
      }
    },
  },

  applications: {
    async getByWorker(workerId: string): Promise<Application[]> {
      const response = await fetch(`${API_BASE_URL}/applications/worker/${workerId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch worker applications');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.applications || [];
      return list.map(normalizeApplication);
    },

    async getByJob(jobId: string): Promise<Application[]> {
      const response = await fetch(`${API_BASE_URL}/applications/job/${jobId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch job applications');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.applications || [];
      return list.map(normalizeApplication);
    },

    async create(payload: {
      jobId: string;
      job_id?: string;
      workerId: string;
      worker_id?: string;
      message?: string;
      expectedWage?: number;
      expected_wage?: number;
    }): Promise<Application> {
      const body = {
        jobId: payload.jobId,
        job_id: payload.jobId,
        workerId: payload.workerId,
        worker_id: payload.workerId,
        message: payload.message || '',
        expectedWage: payload.expectedWage ?? payload.expected_wage ?? 0,
        expected_wage: payload.expectedWage ?? payload.expected_wage ?? 0,
      };
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to submit application');
      }
      return normalizeApplication(data);
    },

    async updateStatus(
      id: string,
      status: 'pending' | 'accepted' | 'rejected' | 'hired' | 'completed' | 'paid',
      extra?: {
        payment_mode?: string;
        paymentMode?: string;
        upi_id?: string;
        upiId?: string;
        bank_details?: any;
        bankDetails?: any;
      }
    ): Promise<Application> {
      const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to update application');
      }
      return normalizeApplication(data);
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.error || 'Failed to delete application');
      }
    },
  },

  users: {
    async getById(id: string): Promise<Profile> {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      return normalizeProfile(data);
    },

    async update(id: string, payload: {
      full_name?: string;
      name?: string;
      phone?: string | null;
      bio?: string | null;
      location?: string | null;
      skills?: string[] | string | null;
      primary_skill?: string | null;
      experience_level?: string | null;
      company_name?: string | null;
      company_type?: string | null;
      gst_or_id?: string | null;
      is_verified?: boolean;
      verification_status?: 'unverified' | 'pending' | 'verified';
      verification_badge?: 'unverified' | 'phone_verified' | 'verified_worker';
      is_available_now?: boolean;
      available_status_text?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }): Promise<Profile> {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to update user profile');
      }
      return normalizeProfile(data);
    },
  },

  workers: {
    async getAvailable(filters?: {
      skill?: string;
      search?: string;
      available_only?: boolean;
    }): Promise<Profile[]> {
      const params = new URLSearchParams();
      if (filters?.skill) params.set('skill', filters.skill);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.available_only !== undefined) {
        params.set('available_only', String(filters.available_only));
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/users/workers/available${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch available workers');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.workers || [];
      return list.map(normalizeProfile);
    },

    async updateAvailability(
      workerId: string,
      isAvailable: boolean,
      statusText?: string,
      coords?: { latitude?: number | null; longitude?: number | null }
    ): Promise<Profile> {
      return api.users.update(workerId, {
        is_available_now: isAvailable,
        available_status_text: statusText || (isAvailable ? 'काम के लिए तुरंत उपलब्ध (Ready to work now)' : ''),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
    },
  },

  auth: {
    async sendOtp(payload: { phone?: string; email?: string; purpose?: string }): Promise<{
      success: boolean;
      message: string;
      target: string;
      debugOtp?: string;
    }> {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to send OTP');
      }
      return data;
    },

    async verifyOtp(payload: { phone?: string; email?: string; otp: string }): Promise<{
      success: boolean;
      message: string;
    }> {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to verify OTP');
      }
      return data;
    },

    async forgotPasswordSendOtp(payload: { identifier: string; role?: Role }): Promise<{
      success: boolean;
      message: string;
      isPhoneTarget?: boolean;
      target?: string;
      rawTarget?: string;
      userRole?: string;
      accountEmail?: string;
      debugOtp?: string;
    }> {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to send password reset OTP');
      }
      return data;
    },

    async forgotPasswordReset(payload: {
      identifier: string;
      otp: string;
      newPassword: string;
      role?: Role;
    }): Promise<{
      success: boolean;
      message: string;
      user?: {
        email: string;
        role: string;
        name: string;
      };
    }> {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to reset password');
      }
      return data;
    },
  },

  admin: {
    async getStats(): Promise<{
      totalWorkers: number;
      totalEmployers: number;
      totalUsers: number;
      totalJobs: number;
      openJobs: number;
      closedJobs: number;
      totalApplications: number;
      completedApplications: number;
      paidApplications: number;
      payouts: { cash: number; upi: number; bank: number };
    }> {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      const data = await response.json();
      return data.stats;
    },

    async getUsers(): Promise<any[]> {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users list');
      }
      const data = await response.json();
      return data.users || [];
    },

    async toggleUserVerification(id: string, isVerified: boolean): Promise<any> {
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}/verify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_verified: isVerified }),
      });
      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }
      return await response.json();
    },

    async toggleUserBan(id: string, isBanned: boolean): Promise<any> {
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_banned: isBanned }),
      });
      if (!response.ok) {
        throw new Error('Failed to update ban status');
      }
      return await response.json();
    },

    async getJobs(): Promise<any[]> {
      const response = await fetch(`${API_BASE_URL}/admin/jobs`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch jobs list');
      }
      const data = await response.json();
      return data.jobs || [];
    },

    async deleteJob(id: string): Promise<void> {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
    },

    async getApplications(): Promise<any[]> {
      const response = await fetch(`${API_BASE_URL}/admin/applications`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch applications list');
      }
      const data = await response.json();
      return data.applications || [];
    },
  },
};
