export type RawSearchParams = Record<string, string | string[] | undefined>;

export function param(sp: RawSearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function periodParams(sp: RawSearchParams): { period?: string; from?: string; to?: string } {
  return { period: param(sp, "period"), from: param(sp, "from"), to: param(sp, "to") };
}
