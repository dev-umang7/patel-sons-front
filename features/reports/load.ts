import { metaRepository } from "@/data-access";
import type { ReportFilters } from "@/data-access/types";
import { resolvePeriod } from "@/lib/period";
import { param, periodParams, type RawSearchParams } from "@/lib/search-params";

const ID = /^[a-z]{3}-[a-z0-9-]+$/;

/** Resolves period + validated dimension filters from a report's search params. */
export async function loadReportContext(sp: RawSearchParams, fallback: "30d" | "90d" | "fytd" | "12m" = "90d") {
  const meta = await metaRepository.getMeta();
  const period = resolvePeriod(periodParams(sp), meta.asOf, fallback);
  const pick = (key: string) => {
    const v = param(sp, key);
    return v && ID.test(v) ? v : undefined;
  };
  const filters: ReportFilters = { categoryId: pick("category"), brandId: pick("brand"), vendorId: pick("vendor"), productId: pick("product"), customerId: pick("customer") };
  return { meta, period, filters, reportPeriod: { range: { from: period.from, to: period.to }, previous: period.previous, granularity: period.granularity } };
}
