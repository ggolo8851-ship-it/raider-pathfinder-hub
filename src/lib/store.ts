export interface UserProfile {
  major: string;
  gpa: string;
  aps: string[];
  gradYear: string;
}

export interface User {
  name: string;
  username: string;
  pass: string;
  setupComplete: boolean;
  profile: UserProfile;
}

export type UsersDB = Record<string, User>;

const DB_KEY = 'raider_db';
const SESSION_KEY = 'raider_session';

export const AP_LIST = [
  "AP Biology", "AP Calculus", "AP Computer Science", "AP Psychology",
  "AP US History", "AP English", "AP Chemistry", "AP Physics"
];

export const GRAD_YEARS = ["2026", "2027", "2028", "2029"];

export function getUsers(): UsersDB {
  return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}

export function saveUsers(users: UsersDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(email: string) {
  localStorage.setItem(SESSION_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.clear();
}
