import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/layout/page";
import { productRepository } from "@/data-access";
import { BrandsTable } from "@/features/inventory/brands-table";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage({ searchParams }: PageProps<"/inventory/brands">) {
  const brands = await productRepository.listBrands();
  const brandId = param(await searchParams, "brand");
  const selected = brands.find((b) => b.id === brandId);
  return (
    <Page>
      <PageHeader eyebrow="Inventory" title="Brands" description="Purchase of goods is controlled by brands and vendors — how each brand sells, earns and moves, and who supplies it." />
      <BrandsTable brands={brands} initialSearch={selected?.name} />
    </Page>
  );
}
