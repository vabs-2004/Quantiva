import apiClient from "./api";

/**
 * Searches across all learning resources (Micro Modules, Algorithms, Courses, Docs).
 * GET /api/search
 * @param {Object} params - { q, category, limit, offset }
 */
export async function searchResources({ q = "", category = "all", limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (category && category !== "all") params.append("category", category);
  if (limit) params.append("limit", limit);
  if (offset) params.append("offset", offset);

  const res = await apiClient.get(`/search?${params.toString()}`);
  return res.data;
}

/**
 * Retrieves deterministic explore landing sections for empty state.
 * GET /api/explore/featured
 */
export async function getExploreFeatured() {
  const res = await apiClient.get("/explore/featured");
  return res.data;
}
