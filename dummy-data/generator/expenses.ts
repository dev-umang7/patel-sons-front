/** Operating expenses: fixed monthly costs, seasonal marketing, inward freight. */
import type { Expense } from "@/data-access/types/finance";
import type { Purchase } from "@/data-access/types/procurement";
import { eachMonth, endOfMonth, type ISOMonth } from "@/lib/dates";
import type { VendorSeed } from "../vendors";
import type { Rng } from "./random";
import { AS_OF, HISTORY_START } from "./seasonality";

const HOME_CITY = "Vadodara";

export function simulateExpenses(
  rng: Rng,
  purchases: Purchase[],
  vendors: VendorSeed[],
  cardSalesByMonth: Map<string, number>,
): Expense[] {
  const out: Expense[] = [];
  let seq = 0;
  const add = (e: Omit<Expense, "id">) => out.push({ id: `exp-${String(++seq).padStart(4, "0")}`, ...e });
  const day = (m: ISOMonth, d: number) => `${m}-${String(d).padStart(2, "0")}`;

  for (const m of eachMonth(HISTORY_START, AS_OF)) {
    const month = Number(m.slice(5));
    const newFy = m >= "2026-04";

    add({ date: day(m, 1), category: "rent", amount: newFy ? 82_000 : 78_000, description: "Showroom rent — Alkapuri", payee: "Shah Estates" });
    add({ date: endOfMonth(m), category: "salaries", amount: newFy ? 1_68_000 : 1_58_500, description: "Staff salaries (7)", payee: "Staff payroll" });
    if (m === "2025-10") add({ date: day(m, 15), category: "salaries", amount: 70_000, description: "Diwali bonus — staff", payee: "Staff payroll" });

    const summer = month >= 4 && month <= 6;
    const shoulder = month === 3 || month === 9 || month === 10;
    add({ date: day(m, 12), category: "utilities", amount: Math.round(9_500 + (summer ? 8_000 : shoulder ? 3_000 : 0) + rng.range(-800, 800)), description: "Electricity bill", payee: "MGVCL" });
    add({ date: day(m, 5), category: "utilities", amount: 2_124, description: "Broadband & phone lines", payee: "Business broadband" });

    const marketing =
      m === "2025-10" ? 30_000 : month === 11 || month === 12 || month === 1 ? 14_000 : m === "2026-09" ? 22_000 : Math.round(rng.range(6_000, 9_000));
    add({ date: day(m, 8), category: "marketing", amount: marketing, description: m === "2025-10" ? "Diwali newspaper inserts & hoardings" : "Local newspaper inserts & broadcasts", payee: "Sandesh Ad Services" });
    if (m === "2025-10") add({ date: day(m, 4), category: "marketing", amount: 18_000, description: "Diwali gifting catalogue print run", payee: "Pratik Printers", productCategoryId: "cat-gifts" });
    if (m === "2026-09") add({ date: day(m, 22), category: "marketing", amount: 9_500, description: "Navratri décor display", payee: "Pratik Printers", productCategoryId: "cat-decor" });

    add({ date: day(m, 10), category: "packaging", amount: Math.round(rng.range(4_500, 7_000)), description: "Carry bags & gift wrap", payee: "Rangoli Gift Packaging Co." });
    if (m === "2025-10") add({ date: day(m, 6), category: "packaging", amount: 9_000, description: "Festive gift boxes", payee: "Rangoli Gift Packaging Co.", productCategoryId: "cat-gifts" });

    if (month % 3 === 0) add({ date: day(m, 18), category: "maintenance", amount: 4_800, description: "AC servicing (quarterly)", payee: "CoolCare Services" });
    if (rng.chance(0.25)) add({ date: day(m, rng.int(3, 26)), category: "maintenance", amount: Math.round(rng.range(1_200, 6_500)), description: "Display & fixture repairs", payee: "Mistry Carpentry Works" });

    const card = cardSalesByMonth.get(m) ?? 0;
    if (card > 0) add({ date: endOfMonth(m), category: "bank-charges", amount: Math.round(card * 0.012), description: "Card terminal charges", payee: "Acquiring bank" });

    add({ date: day(m, 20), category: "miscellaneous", amount: Math.round(rng.range(2_000, 3_600)), description: "Stationery, tea & sundries", payee: "Petty cash" });
  }

  const vendorById = new Map(vendors.map((v) => [v.id, v]));
  for (const p of purchases) {
    if (!p.receivedOn) continue;
    const vendor = vendorById.get(p.vendorId)!;
    const value = p.items.reduce((acc, i) => acc + i.receivedQuantity * i.unitCost, 0);
    const amount =
      vendor.city === HOME_CITY
        ? rng.chance(0.5) ? Math.round(rng.range(150, 320)) : 0
        : Math.max(350, Math.round(value * rng.range(0.008, 0.014)));
    if (amount === 0) continue;
    add({
      date: p.receivedOn,
      category: "freight",
      amount,
      description: `Inward freight — ${p.number}`,
      payee: vendor.city === HOME_CITY ? "Local tempo" : rng.pick(["Shreeji Roadlines", "Gujarat Cargo Movers", "Patel Roadways"]),
      purchaseId: p.id,
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
