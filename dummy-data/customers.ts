/**
 * DUMMY DATA — customers, loyalty tiers, coupons and campaigns.
 * All people and businesses are fictional. `sim` fields drive the generator only.
 */
import type { Campaign, Coupon, Customer, LoyaltyTier } from "@/data-access/types/crm";

export type PaymentBehaviour = "prompt" | "late" | "partial" | "chronic";

export interface CustomerSeed extends Customer {
  sim: {
    /** Relative visit frequency. */
    weight: number;
    /** Share of this customer's bills raised on credit. */
    creditShare: number;
    payment: PaymentBehaviour;
    /** Basket size multiplier (business buyers purchase in quantity). */
    basket: number;
  };
}

interface Row {
  n: number;
  name: string;
  area: string;
  phone: string;
  joined: string;
  weight: number;
  business?: string;
  credit?: number;
  creditShare?: number;
  payment?: PaymentBehaviour;
  basket?: number;
  email?: string;
  notes?: string;
}

function customer(r: Row): CustomerSeed {
  return {
    id: `cus-${String(r.n).padStart(3, "0")}`,
    name: r.name,
    businessName: r.business,
    type: r.business ? "business" : "individual",
    phone: r.phone,
    email: r.email,
    area: r.area,
    city: "Vadodara",
    joinedOn: r.joined,
    creditDays: r.credit,
    notes: r.notes,
    sim: {
      weight: r.weight,
      creditShare: r.creditShare ?? 0,
      payment: r.payment ?? "prompt",
      basket: r.basket ?? 1,
    },
  };
}

export const customerSeeds: CustomerSeed[] = [
  // Business buyers (corporate gifting, caterers, events)
  customer({ n: 1, name: "Viral Joshi", business: "Shubh Events & Weddings", area: "Alkapuri", phone: "+91 98250 11408", joined: "2021-02-11", weight: 5, credit: 30, creditShare: 0.75, payment: "late", basket: 3.2, email: "accounts@shubhevents.example", notes: "Bulk gift sets for wedding clients. Prefers credit billing." }),
  customer({ n: 2, name: "Anand Pillai", business: "BlueLeaf Software LLP", area: "Gotri", phone: "+91 99798 20431", joined: "2022-09-05", weight: 2.4, credit: 45, creditShare: 0.9, payment: "prompt", basket: 4, email: "admin@blueleafsw.example", notes: "Diwali corporate gifting every year." }),
  customer({ n: 3, name: "Harshad Bhatt", business: "Riddhi Siddhi Caterers", area: "Manjalpur", phone: "+91 98242 77816", joined: "2020-06-18", weight: 4, credit: 30, creditShare: 0.6, payment: "partial", basket: 2.6 }),
  customer({ n: 4, name: "Sunita Rao", business: "Hotel Surya Residency", area: "Sayajigunj", phone: "+91 97240 63355", joined: "2023-01-09", weight: 2.6, credit: 30, creditShare: 0.7, payment: "chronic", basket: 2.8, notes: "Repeated follow-ups needed on dues." }),
  customer({ n: 5, name: "Mitesh Shah", business: "Aarav Infra Pvt. Ltd.", area: "Vasna Road", phone: "+91 98795 30092", joined: "2022-10-14", weight: 1.6, credit: 45, creditShare: 0.85, payment: "late", basket: 4.2 }),
  customer({ n: 6, name: "Nirav Gandhi", business: "Gokul Sweets & Farsan", area: "Karelibaug", phone: "+91 94262 18870", joined: "2019-08-21", weight: 3.2, credit: 21, creditShare: 0.5, payment: "prompt", basket: 2.2 }),
  customer({ n: 7, name: "Dr. Kavita Menon", business: "Medicare Diagnostics", area: "Race Course", phone: "+91 99250 55247", joined: "2023-06-30", weight: 1.4, credit: 30, creditShare: 0.8, payment: "late", basket: 3 }),
  customer({ n: 8, name: "Jayesh Parmar", business: "Kalpvruksh Interiors", area: "Old Padra Road", phone: "+91 98988 41126", joined: "2024-02-02", weight: 1.8, credit: 30, creditShare: 0.55, payment: "partial", basket: 2.4 }),

  // Individuals
  customer({ n: 9, name: "Meera Desai", area: "Alkapuri", phone: "+91 98251 22394", joined: "2018-11-03", weight: 6.5, credit: 15, creditShare: 0.05, notes: "Long-standing customer; buys for family functions." }),
  customer({ n: 10, name: "Rajesh Patel", area: "Akota", phone: "+91 98245 60781", joined: "2017-04-12", weight: 6, credit: 15, creditShare: 0.08, payment: "late" }),
  customer({ n: 11, name: "Hetal Trivedi", area: "Gotri", phone: "+91 99090 14572", joined: "2020-01-25", weight: 5.2 }),
  customer({ n: 12, name: "Amit Chauhan", area: "Waghodia Road", phone: "+91 97129 88430", joined: "2021-07-08", weight: 3.6 }),
  customer({ n: 13, name: "Priya Iyer", area: "Fatehgunj", phone: "+91 98799 31068", joined: "2022-03-17", weight: 4.2 }),
  customer({ n: 14, name: "Kiran Solanki", area: "Manjalpur", phone: "+91 94275 46613", joined: "2019-10-29", weight: 3.4, credit: 15, creditShare: 0.12, payment: "partial" }),
  customer({ n: 15, name: "Dhruv Mehta", area: "Sama", phone: "+91 98986 72215", joined: "2023-05-06", weight: 2.8 }),
  customer({ n: 16, name: "Nisha Agarwal", area: "Vasna Road", phone: "+91 99785 09344", joined: "2021-12-01", weight: 3.9 }),
  customer({ n: 17, name: "Pankaj Rathod", area: "Karelibaug", phone: "+91 98256 33981", joined: "2016-08-15", weight: 4.8, credit: 15, creditShare: 0.06 }),
  customer({ n: 18, name: "Sneha Kulkarni", area: "Old Padra Road", phone: "+91 97377 51204", joined: "2024-01-20", weight: 2.4 }),
  customer({ n: 19, name: "Vikram Jadeja", area: "Harni", phone: "+91 98240 98166", joined: "2020-09-09", weight: 2.6, credit: 15, creditShare: 0.1, payment: "chronic" }),
  customer({ n: 20, name: "Falguni Vyas", area: "Nizampura", phone: "+91 99256 47730", joined: "2018-02-22", weight: 4.4 }),
  customer({ n: 21, name: "Rohan Malhotra", area: "Alkapuri", phone: "+91 98795 61842", joined: "2025-03-11", weight: 2 }),
  customer({ n: 22, name: "Bhavna Pandya", area: "Subhanpura", phone: "+91 94268 20517", joined: "2017-06-05", weight: 5 }),
  customer({ n: 23, name: "Chirag Modi", area: "Akota", phone: "+91 98250 87623", joined: "2022-11-28", weight: 2.2 }),
  customer({ n: 24, name: "Ritu Sharma", area: "Gorwa", phone: "+91 97240 15598", joined: "2023-08-14", weight: 2.5 }),
  customer({ n: 25, name: "Tushar Dave", area: "Manjalpur", phone: "+91 99099 66201", joined: "2019-04-03", weight: 3 }),
  customer({ n: 26, name: "Asha Christian", area: "Fatehgunj", phone: "+91 98242 30755", joined: "2020-12-19", weight: 2.2 }),
  customer({ n: 27, name: "Yash Panchal", area: "Waghodia Road", phone: "+91 97272 84013", joined: "2024-06-26", weight: 1.8 }),
  customer({ n: 28, name: "Komal Shukla", area: "Sama", phone: "+91 98986 15460", joined: "2021-05-30", weight: 2.6 }),
  customer({ n: 29, name: "Sameer Qureshi", area: "Tandalja", phone: "+91 99786 42197", joined: "2022-07-12", weight: 2.1, credit: 15, creditShare: 0.1, payment: "late" }),
  customer({ n: 30, name: "Leena Thomas", area: "Race Course", phone: "+91 98251 79032", joined: "2018-09-07", weight: 3.3 }),
  customer({ n: 31, name: "Parth Brahmbhatt", area: "Gotri", phone: "+91 94280 36614", joined: "2025-01-04", weight: 1.6 }),
  customer({ n: 32, name: "Daksha Raval", area: "Karelibaug", phone: "+91 98250 52278", joined: "2016-03-18", weight: 3.7 }),
  customer({ n: 33, name: "Imran Saiyed", area: "Panigate", phone: "+91 97129 40985", joined: "2023-02-08", weight: 1.9 }),
  customer({ n: 34, name: "Neha Gupta", area: "Vasna Road", phone: "+91 99090 87751", joined: "2024-10-02", weight: 2.3 }),
  customer({ n: 35, name: "Hardik Soni", area: "Nizampura", phone: "+91 98795 24410", joined: "2021-03-21", weight: 1.7 }),
  customer({ n: 36, name: "Manisha Bhavsar", area: "Ellora Park", phone: "+91 98245 13369", joined: "2019-12-12", weight: 2.9 }),
  customer({ n: 37, name: "Arjun Nair", area: "Subhanpura", phone: "+91 97377 90623", joined: "2025-06-15", weight: 1.5 }),
  customer({ n: 38, name: "Pooja Kapadia", area: "Alkapuri", phone: "+91 99256 08847", joined: "2020-04-27", weight: 3.1 }),
  customer({ n: 39, name: "Gaurav Jain", area: "Akota", phone: "+91 98986 55302", joined: "2022-01-16", weight: 2.4 }),
  customer({ n: 40, name: "Rekha Makwana", area: "Harni", phone: "+91 94262 71158", joined: "2023-11-09", weight: 1.9 }),
  customer({ n: 41, name: "Sanjay Kaushik", area: "Gotri", phone: "+91 98240 46621", joined: "2025-09-01", weight: 1.3 }),
  customer({ n: 42, name: "Varsha Limbachiya", area: "Makarpura", phone: "+91 97240 62835", joined: "2024-04-11", weight: 1.6 }),
];

/** ASSUMPTION — tier thresholds & benefits are placeholders pending confirmation. */
export const loyaltyTiers: LoyaltyTier[] = [
  { id: "tier-member", name: "Member", minAnnualSpend: 0, benefits: ["Earn points on every bill"] },
  { id: "tier-silver", name: "Silver", minAnnualSpend: 25_000, benefits: ["Earn points on every bill", "Day-specific coupons"] },
  { id: "tier-gold", name: "Gold", minAnnualSpend: 75_000, benefits: ["Earn points on every bill", "Day-specific coupons", "Early festive offers"] },
  { id: "tier-platinum", name: "Platinum", minAnnualSpend: 1_50_000, benefits: ["Earn points on every bill", "Day-specific coupons", "Early festive offers", "Priority gift selection"] },
];

export const campaigns: Campaign[] = [
  { id: "cmp-diwali-25", name: "Diwali 2025 Gifting", occasion: "Diwali", startsOn: "2025-10-10", endsOn: "2025-10-23", description: "Dhanteras and Diwali gifting push with day-specific coupons." },
  { id: "cmp-wedding-25", name: "Wedding Season 2025–26", occasion: "Wedding season", startsOn: "2025-11-15", endsOn: "2026-02-28", description: "Dinner sets, cookers and gift sets for wedding buyers." },
  { id: "cmp-summer-26", name: "Summer Comfort 2026", occasion: "Summer", startsOn: "2026-03-15", endsOn: "2026-05-31", description: "Fans and bottles for the summer season." },
  { id: "cmp-diwali-26", name: "Navratri & Diwali 2026", occasion: "Diwali", startsOn: "2026-10-11", endsOn: "2026-11-10", description: "Planned festive campaign: Navratri through Diwali." },
];

export const coupons: Coupon[] = [
  { id: "cpn-dhanteras25", code: "DHANTERAS25", title: "Dhanteras special", description: "10% off cookware and kitchen appliances on Dhanteras.", schedule: { kind: "dates", dates: ["2025-10-18"] }, discount: { kind: "percent", value: 10, maxDiscount: 1000 }, minBillAmount: 2000, segment: "all", categoryIds: ["cat-cookware", "cat-kitchen"], campaignId: "cmp-diwali-25" },
  { id: "cpn-diwali25", code: "DIWALIGIFT", title: "Diwali gifting", description: "Flat ₹300 off gift sets on Diwali eve and Diwali.", schedule: { kind: "dates", dates: ["2025-10-19", "2025-10-20"] }, discount: { kind: "flat", value: 300 }, minBillAmount: 2500, segment: "all", categoryIds: ["cat-gifts", "cat-decor"], campaignId: "cmp-diwali-25" },
  { id: "cpn-gold-tue", code: "GOLDTUESDAY", title: "Gold Tuesday", description: "5% off for Gold & Platinum members every Tuesday.", schedule: { kind: "weekly", weekdays: [2], from: "2025-11-01", to: "2026-12-31" }, discount: { kind: "percent", value: 5, maxDiscount: 750 }, minBillAmount: 1500, segment: "gold-and-above", categoryIds: [] },
  { id: "cpn-wedding", code: "SHAADI8", title: "Wedding weekend", description: "8% off dinner sets & gift sets on wedding-season Sundays.", schedule: { kind: "weekly", weekdays: [0], from: "2025-11-16", to: "2026-02-22" }, discount: { kind: "percent", value: 8, maxDiscount: 1200 }, minBillAmount: 3000, segment: "all", categoryIds: ["cat-dinnerware", "cat-gifts"], campaignId: "cmp-wedding-25" },
  { id: "cpn-newyear26", code: "NEWYEAR26", title: "New Year's Day", description: "Flat ₹250 off on New Year's Day.", schedule: { kind: "dates", dates: ["2026-01-01"] }, discount: { kind: "flat", value: 250 }, minBillAmount: 1500, segment: "loyalty-members", categoryIds: [] },
  { id: "cpn-uttarayan", code: "UTTARAYAN", title: "Uttarayan", description: "5% storewide on Uttarayan.", schedule: { kind: "dates", dates: ["2026-01-14", "2026-01-15"] }, discount: { kind: "percent", value: 5, maxDiscount: 500 }, minBillAmount: 1000, segment: "all", categoryIds: [] },
  { id: "cpn-holi26", code: "HOLI26", title: "Holi décor", description: "8% off home décor on Holi.", schedule: { kind: "dates", dates: ["2026-03-03"] }, discount: { kind: "percent", value: 8 }, minBillAmount: 800, segment: "all", categoryIds: ["cat-decor"] },
  { id: "cpn-summer", code: "COOLSUMMER", title: "Summer fan days", description: "₹200 off fans on summer Saturdays.", schedule: { kind: "weekly", weekdays: [6], from: "2026-03-21", to: "2026-05-30" }, discount: { kind: "flat", value: 200 }, minBillAmount: 2000, segment: "all", categoryIds: ["cat-comfort"], campaignId: "cmp-summer-26" },
  { id: "cpn-akshaya26", code: "AKSHAYA500", title: "Akshaya Tritiya", description: "Flat ₹500 off dinnerware on Akshaya Tritiya.", schedule: { kind: "dates", dates: ["2026-04-20"] }, discount: { kind: "flat", value: 500 }, minBillAmount: 4000, segment: "all", categoryIds: ["cat-dinnerware"] },
  { id: "cpn-rakhi26", code: "RAKHI10", title: "Raksha Bandhan", description: "10% off personal care & gift sets on Raksha Bandhan.", schedule: { kind: "dates", dates: ["2026-08-27", "2026-08-28"] }, discount: { kind: "percent", value: 10, maxDiscount: 600 }, minBillAmount: 999, segment: "all", categoryIds: ["cat-personal", "cat-gifts"] },
  { id: "cpn-navratri26", code: "NAVRATRI26", title: "Navratri nights", description: "7% off for loyalty members through Navratri.", schedule: { kind: "dates", dates: ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"] }, discount: { kind: "percent", value: 7, maxDiscount: 800 }, minBillAmount: 1500, segment: "loyalty-members", categoryIds: [], campaignId: "cmp-diwali-26", usageLimit: 400 },
  { id: "cpn-dhanteras26", code: "DHANTERAS26", title: "Dhanteras 2026", description: "10% off cookware and kitchen appliances on Dhanteras.", schedule: { kind: "dates", dates: ["2026-11-06"] }, discount: { kind: "percent", value: 10, maxDiscount: 1000 }, minBillAmount: 2000, segment: "all", categoryIds: ["cat-cookware", "cat-kitchen"], campaignId: "cmp-diwali-26" },
  { id: "cpn-diwali26", code: "DIWALI26", title: "Diwali gifting 2026", description: "Flat ₹300 off gift sets for Diwali.", schedule: { kind: "dates", dates: ["2026-11-07", "2026-11-08"] }, discount: { kind: "flat", value: 300 }, minBillAmount: 2500, segment: "all", categoryIds: ["cat-gifts", "cat-decor"], campaignId: "cmp-diwali-26" },
  { id: "cpn-biz-sep", code: "BIZBULK", title: "Business bulk day", description: "4% off for business accounts on the last Friday of the month.", schedule: { kind: "dates", dates: ["2026-06-26", "2026-07-31", "2026-08-28", "2026-09-25"] }, discount: { kind: "percent", value: 4 }, minBillAmount: 10000, segment: "business", categoryIds: [], paused: false },
];
