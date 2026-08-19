import "server-only";

import { publicFetch } from "@/lib/api/client";
import type { RegisterResponse, TokenPair } from "@/lib/api/types";

/**
 * Log in.
 *
 * Form-encoded with a field named `username`, not JSON with `email`, because
 * the endpoint implements the OAuth2 password flow. Sending JSON gets a 422
 * that reads like the password was wrong.
 */
export function login(email: string, password: string): Promise<TokenPair> {
  return publicFetch<TokenPair>("/auth/login", {
    method: "POST",
    form: { username: email, password },
  });
}

export function register(input: {
  email: string;
  password: string;
  full_name?: string | null;
}): Promise<RegisterResponse> {
  return publicFetch<RegisterResponse>("/auth/register", { method: "POST", body: input });
}

export function refresh(refreshToken: string): Promise<TokenPair> {
  return publicFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}
