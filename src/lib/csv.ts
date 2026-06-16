import type { User, UserRole, UserStatus } from "@/types";

export function exportUsersCSV(users: User[]) {
  const headers = ["id", "email", "name", "role", "status", "active_period_end", "created_at"];
  const rows = users.map((u) => [u.id, u.email, u.name, u.role, u.status, u.active_period_end || "", u.created_at].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSVUsers(content: string): Partial<User>[] {
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = headers.indexOf("email");
  const nameIdx = headers.indexOf("name");
  const roleIdx = headers.indexOf("role");
  const statusIdx = headers.indexOf("status");
  const activeIdx = headers.indexOf("active_period_end");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      id: crypto.randomUUID(),
      email: cols[emailIdx] || "",
      name: cols[nameIdx] || "",
      role: (cols[roleIdx] || "guru") as UserRole,
      status: (cols[statusIdx] || "active") as UserStatus,
      active_period_end: cols[activeIdx] || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }).filter((u) => u.email && u.name);
}
