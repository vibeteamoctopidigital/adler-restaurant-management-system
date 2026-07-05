import { useEffect, useState } from "react";

/* ============================================================================
 * Local data layer — localStorage-backed "database" with a mock API delay.
 * Shared by every plans screen (index, builder, summary) so the three pages
 * no longer each carry their own copy of the same types/seed/persistence code.
 * ==========================================================================*/
const DB_KEY = "shift-planner:db:v1";
const NETWORK_DELAY = 400;

export type SlotStatus = "pending" | "accepted" | "rejected";

export interface Availability {
  day: number; // 0=Sun..6=Sat
  start: string;
  end: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // tailwind bg-* class
  hourlyRate: number;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  categoryId: string;
  availability: Availability[];
}

export interface WorkloadRequirement {
  id: string;
  categoryId: string;
  label: string;
  needed: number;
}

export interface AssignedSlot {
  id: string;
  workerId: string;
  categoryId: string;
  day: number;
  start: string;
  end: string;
  hours: number;
  cost: number;
  status: SlotStatus;
  reassignedFrom?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  month: number;
  week: number;
  year: number;
  workload: WorkloadRequirement[];
  slots: AssignedSlot[];
  createdAt: number;
}

interface DB {
  plans: Plan[];
  categories: Category[];
  workers: Worker[];
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const CATEGORY_COLORS = [
  "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-sky-500",
  "bg-rose-500", "bg-lime-500", "bg-indigo-500",
];

export function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

export function currentWeekOfMonth(d: Date) {
  return Math.min(5, Math.ceil(d.getDate() / 7));
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function seedDB(): DB {
  const categories: Category[] = [
    { id: "cat_kitchen", name: "Kitchen", color: "bg-amber-500", hourlyRate: 14 },
    { id: "cat_service", name: "Service", color: "bg-emerald-500", hourlyRate: 12 },
    { id: "cat_cashier", name: "Cashier", color: "bg-sky-500", hourlyRate: 13 },
  ];
  const mkAvail = (days: number[], start: string, end: string): Availability[] =>
    days.map((day) => ({ day, start, end }));
  const workers: Worker[] = [
    { id: "w1", name: "Amina Rahman", email: "amina.rahman@example.com", categoryId: "cat_kitchen", availability: mkAvail([1, 2, 3, 4, 5], "09:00", "17:00") },
    { id: "w2", name: "Tariq Islam", email: "tariq.islam@example.com", categoryId: "cat_kitchen", availability: mkAvail([0, 2, 4, 6], "12:00", "20:00") },
    { id: "w3", name: "Nusrat Jahan", email: "nusrat.jahan@example.com", categoryId: "cat_service", availability: mkAvail([1, 3, 5], "10:00", "18:00") },
    { id: "w4", name: "Rafiul Karim", email: "rafiul.karim@example.com", categoryId: "cat_service", availability: mkAvail([0, 1, 2, 3, 4], "16:00", "23:00") },
    { id: "w5", name: "Sadia Akter", email: "sadia.akter@example.com", categoryId: "cat_cashier", availability: mkAvail([2, 3, 4, 5, 6], "08:00", "14:00") },
    { id: "w6", name: "Imran Hossain", email: "imran.hossain@example.com", categoryId: "cat_cashier", availability: mkAvail([0, 1, 5, 6], "14:00", "22:00") },
  ];
  const now = new Date();
  const demoSlots: AssignedSlot[] = [
    { id: uid("s"), workerId: "w1", categoryId: "cat_kitchen", day: 1, start: "09:00", end: "17:00", hours: 8, cost: 112, status: "accepted" },
    { id: uid("s"), workerId: "w3", categoryId: "cat_service", day: 1, start: "10:00", end: "18:00", hours: 8, cost: 96, status: "pending" },
    { id: uid("s"), workerId: "w5", categoryId: "cat_cashier", day: 2, start: "08:00", end: "14:00", hours: 6, cost: 78, status: "rejected" },
    { id: uid("s"), workerId: "w4", categoryId: "cat_service", day: 0, start: "16:00", end: "23:00", hours: 7, cost: 84, status: "accepted" },
  ];
  const plans: Plan[] = [
    {
      id: "plan_demo",
      name: `Downtown Location — Week ${currentWeekOfMonth(now)}`,
      description: "Sample staffing plan to explore the builder.",
      month: now.getMonth(),
      week: currentWeekOfMonth(now),
      year: now.getFullYear(),
      workload: [
        { id: uid("r"), categoryId: "cat_kitchen", label: "Lunch prep", needed: 2 },
        { id: uid("r"), categoryId: "cat_service", label: "Floor service", needed: 2 },
        { id: uid("r"), categoryId: "cat_cashier", label: "Register", needed: 1 },
      ],
      slots: demoSlots,
      createdAt: Date.now(),
    },
  ];
  return { plans, categories, workers };
}

function readDB(): DB {
  if (typeof window === "undefined") return seedDB();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = seedDB();
      window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return seedDB();
  }
}

function writeDB(db: DB) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent("shift-planner:sync"));
}

function delay<T>(value: T, ms = NETWORK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Subscribes to the local plans "database" and re-renders on any write. */
export function useDB() {
  const [db, setDb] = useState<DB>(() => readDB());
  useEffect(() => {
    const sync = () => setDb(readDB());
    window.addEventListener("shift-planner:sync", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shift-planner:sync", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return db;
}

export const api = {
  async createPlan(input: Omit<Plan, "id" | "createdAt" | "slots">) {
    const db = readDB();
    const plan: Plan = { ...input, id: uid("plan"), slots: [], createdAt: Date.now() };
    db.plans = [plan, ...db.plans];
    writeDB(db);
    await delay(null);
    return plan;
  },
  async deletePlan(id: string) {
    const db = readDB();
    db.plans = db.plans.filter((p) => p.id !== id);
    writeDB(db);
    return delay(true);
  },
  async updatePlan(id: string, patch: Partial<Plan>) {
    const db = readDB();
    db.plans = db.plans.map((p) => (p.id === id ? { ...p, ...patch } : p));
    writeDB(db);
    return delay(true);
  },
  async addCategory(input: Omit<Category, "id">) {
    const db = readDB();
    const cat: Category = { ...input, id: uid("cat") };
    db.categories = [...db.categories, cat];
    writeDB(db);
    return delay(cat);
  },
  async removeCategory(id: string) {
    const db = readDB();
    db.categories = db.categories.filter((c) => c.id !== id);
    writeDB(db);
    return delay(true);
  },
  /** Mock bulk email dispatch — simulates network latency, no real email sent. */
  async sendBulkEmail(recipients: string[]) {
    await delay(null, 1100);
    return { sentAt: Date.now(), recipients };
  },
};
