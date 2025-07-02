import { apiRequest } from "./queryClient";
import type { UserRole } from "@shared/schema";

export interface User {
  role: UserRole;
  iqCode: string;
}

export interface LoginResponse {
  success: boolean;
  role: UserRole;
  iqCode: string;
}

export async function login(iqCode: string): Promise<LoginResponse> {
  const response = await apiRequest("POST", "/api/login", { iqCode });
  return response.json();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/me");
    return await response.json();
  } catch (error) {
    console.error("Errore getCurrentUser:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}
