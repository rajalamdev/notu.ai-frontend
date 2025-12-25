const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  token?: string;
  headers?: Record<string, string>;
}

interface MeetingsResponse {
  success: boolean;
  meetings: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    meetings: {
      total: number;
      completed: number;
      pending: number;
      processing: number;
      failed: number;
    };
    totalMinutes: number;
    totalHours: number;
    tasks: {
      todo: number;
      'in-progress': number;
      done: number;
    };
    totalTasks: number;
  };
}

interface TasksResponse {
  success: boolean;
  data: any[];
  count: number;
}

interface KanbanResponse {
  success: boolean;
  data: {
    todo: any[];
    'in-progress': any[];
    done: any[];
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      cache: 'no-store', // Ensure fresh data for real-time
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async verifyToken(token: string) {
    return this.request('/api/auth/verify', { token });
  }

  async getProfile(token: string) {
    return this.request('/api/auth/profile', { token });
  }

  async updateProfile(token: string, data: { name?: string; preferences?: any }) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      token,
      body: data,
    });
  }

  // Meeting endpoints
  async getMeetings(token: string, params?: { page?: number; limit?: number; status?: string; type?: string; search?: string; filter?: string }): Promise<MeetingsResponse> {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as any).toString() : ''
    }
    return this.request<MeetingsResponse>(`/api/meetings${queryString}`, { token });
  }

  async getMeeting(token: string, id: string) {
    return this.request(`/api/meetings/${id}`, { token });
  }

  async getMeetingAnalytics(token: string, id: string) {
    return this.request(`/api/meetings/${id}/analytics`, { token });
  }

  async createMeeting(token: string, data: any) {
    return this.request('/api/meetings', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async createOnlineMeeting(token: string, data: { meetingUrl: string; platform?: string; duration?: number }) {
    return this.request('/api/meetings/online', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async getMeetingStatus(token: string, id: string) {
    return this.request(`/api/meetings/${id}/status`, { token });
  }

  async retryTranscription(token: string, id: string) {
    return this.request(`/api/meetings/${id}/retry`, {
      method: 'POST',
      token,
    });
  }

  async updateMeeting(token: string, id: string, data: any) {
    return this.request(`/api/meetings/${id}`, {
      method: 'PATCH',
      token,
      body: data,
    });
  }

  async deleteMeeting(token: string, id: string) {
    return this.request(`/api/meetings/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Sharing & Collaboration (Meetings)
  async generateMeetingShareLink(token: string, id: string) {
    return this.request(`/api/meetings/${id}/share`, { method: 'POST', token });
  }

  async joinMeeting(token: string, shareToken: string) {
    return this.request(`/api/meetings/join/${shareToken}`, { method: 'POST', token });
  }

  async revokeMeetingShareLink(token: string, id: string) {
    return this.request(`/api/meetings/${id}/share`, { method: 'DELETE', token });
  }

  async updateMeetingCollaboratorRole(token: string, id: string, userId: string, role: string) {
    return this.request(`/api/meetings/${id}/collaborators/${userId}`, {
      method: 'PATCH',
      token,
      body: { role },
    });
  }

  async removeMeetingCollaborator(token: string, id: string, userId: string) {
    return this.request(`/api/meetings/${id}/collaborators/${userId}`, {
      method: 'DELETE',
      token,
    });
  }

  async exportTranscript(token: string, id: string, format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4' = 'txt') {
    const response = await fetch(`${this.baseUrl}/api/meetings/${id}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }
    return response.blob();
  }

  // Task endpoints
  async getTasks(token: string, params?: { status?: string; meetingId?: string; priority?: string }): Promise<TasksResponse> {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as any).toString() : ''
    }
    return this.request<TasksResponse>(`/api/tasks${queryString}`, { token });
  }

  async getKanbanTasks(token: string, boardId?: string): Promise<KanbanResponse> {
    const queryString = boardId ? `?boardId=${boardId}` : '';
    return this.request<KanbanResponse>(`/api/tasks/kanban${queryString}`, { token });
  }

  async getTask(token: string, id: string) {
    return this.request(`/api/tasks/${id}`, { token });
  }

  async createTask(token: string, data: { title: string; description?: string; status?: string; priority?: string; dueDate?: string; assignee?: string; tags?: string[]; meetingId?: string; boardId?: string }) {
    return this.request('/api/tasks', {
      method: 'POST',
      token,
      body: data,
    });
  }

  async updateTask(token: string, id: string, data: any) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      token,
      body: data,
    });
  }

  async deleteTask(token: string, id: string) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async reorderTasks(token: string, tasks: { id: string; order: number; status: string }[], boardId?: string) {
    return this.request('/api/tasks/reorder', {
      method: 'PATCH',
      token,
      body: { tasks, boardId },
    });
  }

  // Analytics endpoints
  async getStats(token: string): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/analytics/stats', { token });
  }

  async getTrends(token: string, period?: '7d' | '30d' | '90d') {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/api/analytics/trends${queryString}`, { token });
  }

  async getPlatformStats(token: string) {
    return this.request('/api/analytics/platforms', { token });
  }

  async getRecentActivity(token: string, limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request(`/api/analytics/activity${queryString}`, { token });
  }

  // Upload endpoint
  async uploadFile(token: string, file: File, metadata?: any) {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
  // Board endpoints
  async getBoards(token: string, params?: { filter?: string; meetingId?: string; search?: string; page?: number; limit?: number; source?: string }) {
    let queryString = ''
    if (params) {
      const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      queryString = filtered.length ? '?' + new URLSearchParams(Object.fromEntries(filtered) as any).toString() : ''
    }
    return this.request(`/api/boards${queryString}`, { token });
  }

  async getBoard(token: string, id: string) {
    return this.request(`/api/boards/${id}`, { token });
  }

  async updateBoard(token: string, id: string, data: any) {
    return this.request(`/api/boards/${id}`, {
      method: 'PATCH',
      token,
      body: data
    });
  }

  async createBoardFromMeeting(token: string, meetingId: string) {
    return this.request('/api/boards/from-meeting', {
      method: 'POST',
      token,
      body: meetingId,
    });
  }

  async createBoard(token: string, data: { title: string; description?: string; source?: string }) {
    return this.request('/api/boards', {
      method: 'POST',
      token,
      body: data,
    });
  }

  // Sharing & Collaboration (Boards)
  async generateBoardShareLink(token: string, id: string) {
    return this.request(`/api/boards/${id}/share`, { method: 'POST', token });
  }

  async joinBoard(token: string, shareToken: string) {
    return this.request(`/api/boards/join/${shareToken}`, { method: 'POST', token });
  }

  async revokeBoardShareLink(token: string, id: string) {
    return this.request(`/api/boards/${id}/share`, { method: 'DELETE', token });
  }

  async updateBoardCollaboratorRole(token: string, id: string, userId: string, role: string) {
    return this.request(`/api/boards/${id}/collaborators/${userId}`, {
      method: 'PATCH',
      token,
      body: { role },
    });
  }

  async removeBoardCollaborator(token: string, id: string, userId: string) {
    return this.request(`/api/boards/${id}/collaborators/${userId}`, {
      method: 'DELETE',
      token,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
