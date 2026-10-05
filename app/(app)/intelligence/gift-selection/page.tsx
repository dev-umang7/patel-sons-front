import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/layout/page";
import { customerRepository, productRepository } from "@/data-access";
import { GiftSelection } from "@/features/intelligence/gift-selection";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Gift selection" };

export default async function GiftSelectionPage({ searchParams }: PageProps<"/intelligence/gift-selection">) {
  const include = param(await searchParams, "include");
  const [categories, customers] = await Promise.all([productRepository.listCategoryOptions(), customerRepository.listCustomerOptions()]);
  const boost = (include ?? "").split(",").filter((id) => /^prd-\d+$/.test(id));
  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence · AI tool for gift selection"
        title="Gift selection"
        description="Suggests in-stock gifts for an occasion and budget — and can favour non-fast items so slow stock moves through gift bills."
      />
      <GiftSelection categories={categories} customers={customers} boostProductIds={boost} />
    </Page>
  );
}
