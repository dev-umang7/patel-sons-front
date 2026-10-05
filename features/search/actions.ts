"use server";

import { z } from "zod";
import { searchRepository } from "@/data-access";
import type { SearchEntry } from "@/data-access/types";

const querySchema = z.string().trim().max(80);

export async function searchEverything(query: string): Promise<SearchEntry[]> {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) return [];
  return searchRepository.search(parsed.data, 24);
}
