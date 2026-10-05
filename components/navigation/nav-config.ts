import {
  BarChart3,
  Boxes,
  Gauge,
  HeartHandshake,
  type LucideIcon,
  ReceiptIndianRupee,
  Sparkles,
  Truck,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  /** Short description, used by the command menu. */
  hint: string;
}

export interface NavModule {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  items: NavItem[];
}

/**
 * Primary information architecture. Modules follow the business flow from the
 * source notes: Source → Purchase → Inventory → Sales, with CRM, Intelligence and
 * Analytics as supporting layers.
 */
export const NAV: NavModule[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Gauge,
    href: "/",
    items: [{ label: "Dashboard", href: "/", hint: "What is happening in the business" }],
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: Truck,
    href: "/procurement/sources",
    items: [
      { label: "Price comparison", href: "/procurement/sources", hint: "Compare sources and vendor prices" },
      { label: "Vendors", href: "/procurement/vendors", hint: "Brands / vendors and their performance" },
      { label: "Purchase orders", href: "/procurement/orders", hint: "Draft and open orders" },
      { label: "Purchases", href: "/procurement/purchases", hint: "Received purchase history" },
      { label: "Vendor offers", href: "/procurement/offers", hint: "Festive offers and schemes" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    href: "/inventory",
    items: [
      { label: "Overview", href: "/inventory", hint: "Stock value, movement and ageing" },
      { label: "Products", href: "/inventory/products", hint: "All products with stock and margin" },
      { label: "Categories", href: "/inventory/categories", hint: "Category analysis" },
      { label: "Brands", href: "/inventory/brands", hint: "Brand performance" },
      { label: "Stock movement", href: "/inventory/movement", hint: "Receipts, sales and adjustments" },
      { label: "Slow-moving", href: "/inventory/slow-moving", hint: "Non-fast items and money tied up" },
      { label: "Keep / Replace / Eliminate", href: "/inventory/decisions", hint: "Decide on arrival / stock" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: ReceiptIndianRupee,
    href: "/sales",
    items: [
      { label: "Overview", href: "/sales", hint: "Sales performance" },
      { label: "Bills", href: "/sales/bills", hint: "Invoices and gift bills" },
      { label: "Collection of debt", href: "/sales/collections", hint: "Outstanding and overdue amounts" },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: HeartHandshake,
    href: "/crm/customers",
    items: [
      { label: "Customers", href: "/crm/customers", hint: "Profiles, spend and dues" },
      { label: "Loyalty program", href: "/crm/loyalty", hint: "Tiers, points and rewards" },
      { label: "Day-specific coupons", href: "/crm/coupons", hint: "Coupons by date and segment" },
      { label: "Campaigns", href: "/crm/campaigns", hint: "Festive and seasonal campaigns" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Sparkles,
    href: "/intelligence/pricing",
    items: [
      { label: "Price composition", href: "/intelligence/pricing", hint: "What to pay, what to sell for" },
      { label: "Gift selection", href: "/intelligence/gift-selection", hint: "Suggest gifts within a budget" },
      { label: "Recommendations", href: "/intelligence/recommendations", hint: "All simulated suggestions" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/reports",
    items: [
      { label: "Reports", href: "/reports", hint: "All management reports" },
      { label: "Profit", href: "/reports/profit", hint: "Revenue, cost, expenses, profit" },
      { label: "Sales", href: "/reports/sales", hint: "Sales by category, product, customer" },
      { label: "Purchases", href: "/reports/purchases", hint: "Purchase volume by vendor and category" },
      { label: "Category-wise", href: "/reports/categories", hint: "Category-wise report" },
      { label: "Expenses", href: "/reports/expenses", hint: "Expense tracking" },
    ],
  },
];

export function findActive(pathname: string): { module: NavModule; item: NavItem | null } {
  let best: { module: NavModule; item: NavItem | null; score: number } = { module: NAV[0], item: NAV[0].items[0], score: pathname === "/" ? 1 : 0 };
  for (const mod of NAV) {
    for (const item of mod.items) {
      if (item.href === "/") continue;
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (item.href.length > best.score) best = { module: mod, item, score: item.href.length };
      }
    }
  }
  return { module: best.module, item: best.item };
}
