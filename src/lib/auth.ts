import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "right_holder" | "partner" | "editor" | "admin";
export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization: string;
  country: string;
  org_type: "right_holder" | "partner" | "other";
  job_title: string;
  phone: string;
  role: Role | null;
  status: AccountStatus;
  preferred_language: "en" | "tr";
  notify_email: boolean;
  review_reason: string | null;
  reviewed_at: string | null;
  deletion_requested_at: string | null;
  last_login_at: string | null;
  previous_login_at: string | null;
  created_at: string;
}

/** Current user's profile (cached per request), or null when signed out. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

/** Requires an approved account; redirects otherwise. */
export async function requireApproved(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "approved" || !profile.role) redirect("/account-status");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireApproved();
  if (profile.role !== "editor" && profile.role !== "admin") redirect("/");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireApproved();
  if (profile.role !== "admin") redirect("/admin");
  return profile;
}

export const isStaff = (p: Profile | null) => p?.role === "editor" || p?.role === "admin";
export const isAdmin = (p: Profile | null) => p?.role === "admin";
