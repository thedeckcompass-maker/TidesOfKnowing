import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";

export const prerender = false;

export const POST: APIRoute = async () => {
  return json(
    { error: "This endpoint has been retired. Please use the Ask Leilia checkout flow." },
    410,
  );
};
