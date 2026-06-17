import { handleOptions, jsonResponse, errorResponse } from "../../lib/helpers";

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(env);

  try {
    if (request.method === "GET") {
      const usersResult = await env.DB.prepare('SELECT tier, role, count(*) as count FROM users GROUP BY tier, role').all();
      
      let stats = {
        totalUsers: 0,
        totalEssential: 0,
        totalPremium: 0,
        totalUltimate: 0,
        totalSupreme: 0,
        totalTitan: 0,
        totalGuruPertama: 0,
        totalGuruMuda: 0,
        totalGuruMadya: 0,
        totalGuruUtama: 0,
        totalPimpinan: 0,
        totalStaf: 0,
        growth: [
          { name: 'Jan', users: 0, revenue: 0 },
          { name: 'Feb', users: 0, revenue: 0 },
          { name: 'Mar', users: 0, revenue: 0 },
          { name: 'Apr', users: 0, revenue: 0 },
          { name: 'May', users: 0, revenue: 0 },
          { name: 'Jun', users: 0, revenue: 0 }
        ]
      };

      if (usersResult.success && usersResult.results) {
        usersResult.results.forEach((row: any) => {
          const count = row.count as number;
          stats.totalUsers += count;
          
          // Count by tier
          switch(row.tier) {
            case 'Essential': stats.totalEssential += count; break;
            case 'Premium': stats.totalPremium += count; break;
            case 'Ultimate': stats.totalUltimate += count; break;
            case 'Supreme': stats.totalSupreme += count; break;
            case 'Titan': stats.totalTitan += count; break;
          }

          // Count by badge/role
          switch(row.role) {
            case 'Guru Pertama': stats.totalGuruPertama += count; break;
            case 'Guru Muda': stats.totalGuruMuda += count; break;
            case 'Guru Madya': stats.totalGuruMadya += count; break;
            case 'Guru Utama': stats.totalGuruUtama += count; break;
            case 'Pimpinan': stats.totalPimpinan += count; break;
            case 'Staf': stats.totalStaf += count; break;
          }
        });
      }
      
      return jsonResponse(stats, env);
    } 
    return errorResponse("Method not allowed", env, 405);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
