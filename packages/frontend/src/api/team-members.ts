import type {
  ApiErrorResponse,
  ApiResponse,
  CreateTeamMemberRequest,
  TeamMember,
  UpdateTeamMemberRequest,
} from '@template/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorResponse
  ) {
    super(data.message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({
      error: 'Unknown error',
      message: 'An unexpected error occurred',
    }));
    throw new ApiError(response.status, data);
  }
  return response.json();
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch(`${API_URL}/team-members`);
  const result = await handleResponse<ApiResponse<TeamMember[]>>(response);
  return result.data;
}

export async function getTeamMember(id: string): Promise<TeamMember> {
  const response = await fetch(`${API_URL}/team-members/${id}`);
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function createTeamMember(data: CreateTeamMemberRequest): Promise<TeamMember> {
  const response = await fetch(`${API_URL}/team-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function updateTeamMember(
  id: string,
  data: UpdateTeamMemberRequest
): Promise<TeamMember> {
  const response = await fetch(`${API_URL}/team-members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/team-members/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(response);
}
