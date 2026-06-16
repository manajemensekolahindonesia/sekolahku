interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: object;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result<unknown>>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

type Bindings = {
  DB: D1Database;
  POLLINATIONS_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string;
  OWNER_EMAIL: string;
};

function formatUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    avatar_url: row.avatar_url as string | null,
    google_id: row.google_id as string | null,
    subscription_id: row.subscription_id as string | null,
    active_period_end: row.active_period_end as string | null,
    status: row.status as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function getUsers(db: D1Database, filters?: { role?: string; status?: string; search?: string; limit?: number; offset?: number }) {
  let query = "SELECT * FROM users WHERE 1=1";
  const params: unknown[] = [];

  if (filters?.role) {
    query += " AND role = ?";
    params.push(filters.role);
  }
  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters?.search) {
    query += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  query += " ORDER BY created_at DESC";
  if (filters?.limit) query += " LIMIT ?";
  if (filters?.limit) params.push(filters.limit);
  if (filters?.offset) query += " OFFSET ?";
  if (filters?.offset) params.push(filters.offset);

  const stmt = db.prepare(query).bind(...params);
  const result = await stmt.all<Record<string, unknown>>();
  return result.results.map(formatUser);
}

async function getUserById(db: D1Database, id: string) {
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? formatUser(row) : null;
}

async function getUserByEmail(db: D1Database, email: string) {
  const row = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<Record<string, unknown>>();
  return row ? formatUser(row) : null;
}

async function createUser(db: D1Database, user: {
  id: string;
  email: string;
  name: string;
  role: string;
  google_id?: string;
  avatar_url?: string;
  subscription_id?: string;
}) {
  await db.prepare(
    "INSERT INTO users (id, email, name, role, google_id, avatar_url, subscription_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(user.id, user.email, user.name, user.role, user.google_id || null, user.avatar_url || null, user.subscription_id || null).run();
  return getUserById(db, user.id);
}

async function updateUserStatus(db: D1Database, id: string, status: string) {
  await db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run();
  return getUserById(db, id);
}

async function deleteUser(db: D1Database, id: string) {
  await db.prepare("DELETE FROM users WHERE id = ? AND role != 'owner'").bind(id).run();
}

export type { D1Database, D1PreparedStatement, D1Result, Bindings };
export { getUsers, getUserById, getUserByEmail, createUser, updateUserStatus, deleteUser, formatUser };
