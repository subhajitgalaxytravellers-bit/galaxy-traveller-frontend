import client from "@/api/client";

export async function getSearchHome(params = {}) {
  const qs = new URLSearchParams();

  if (params.place) qs.append("place", params.place);
  if (params.duration) qs.append("duration", params.duration);
  if (params.category) qs.append("category", params.category);
  if (params.min) qs.append("min", params.min);
  if (params.max) qs.append("max", params.max);

  const res = await client.get(`/tour/search-home?${qs.toString()}`);

  return (
    res?.data?.data || {
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    }
  );
}
