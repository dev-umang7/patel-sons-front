/**
 * DUMMY DATA — vendors / sources. All vendor businesses are fictional.
 * `sim.priceFactor` positions each vendor's pricing relative to the market
 * (generator input only).
 */
import type { Vendor, VendorOffer } from "@/data-access/types/procurement";

export interface VendorSeed extends Vendor {
  sim: { priceFactor: number; reliability: number };
}

export const vendorSeeds: VendorSeed[] = [
  {
    id: "ven-ganesh", name: "Shree Ganesh Distributors", type: "distributor", city: "Ahmedabad", state: "Gujarat",
    contactPerson: "Bhavesh Thakkar", phone: "+91 98250 41762", email: "orders@shreeganeshdist.example",
    gstin: "24AAKFS4821K1ZP", paymentTermsDays: 30, leadTimeDays: 4, since: "2016-07-01",
    brandIds: ["brd-prestige", "brd-pigeon", "brd-butterfly", "brd-hawkins"],
    sim: { priceFactor: 1.0, reliability: 0.92 },
  },
  {
    id: "ven-mehta", name: "Mehta Home Appliances Pvt. Ltd.", type: "distributor", city: "Ahmedabad", state: "Gujarat",
    contactPerson: "Ketan Mehta", phone: "+91 98240 17733", email: "sales@mehtahomeappl.example",
    gstin: "24AABCM7731Q1Z4", paymentTermsDays: 45, leadTimeDays: 5, since: "2014-02-15",
    brandIds: ["brd-bajaj", "brd-havells", "brd-usha", "brd-morphy"],
    sim: { priceFactor: 0.99, reliability: 0.88 },
  },
  {
    id: "ven-kothari", name: "Kothari Kitchenware Wholesale", type: "wholesaler", city: "Mumbai", state: "Maharashtra",
    contactPerson: "Nilesh Kothari", phone: "+91 98201 55804", email: "nilesh@kotharikitchen.example",
    gstin: "27AAGFK2208L1ZB", paymentTermsDays: 15, leadTimeDays: 7, since: "2019-11-01",
    brandIds: ["brd-hawkins", "brd-prestige", "brd-pigeon", "brd-wonderchef"],
    sim: { priceFactor: 0.965, reliability: 0.8 },
  },
  {
    id: "ven-sai", name: "Sai Crockery House", type: "wholesaler", city: "Rajkot", state: "Gujarat",
    contactPerson: "Jignesh Dholakia", phone: "+91 99099 32418", email: "saicrockery.rajkot@mail.example",
    gstin: "24ABMFS6610D1ZK", paymentTermsDays: 30, leadTimeDays: 5, since: "2017-05-20",
    brandIds: ["brd-borosil", "brd-larah", "brd-laopala", "brd-cello"],
    sim: { priceFactor: 0.98, reliability: 0.9 },
  },
  {
    id: "ven-vardhman", name: "Vardhman Electricals", type: "distributor", city: "Vadodara", state: "Gujarat",
    contactPerson: "Sanjay Shah", phone: "+91 98252 60911", email: "accounts@vardhmanelec.example",
    gstin: "24AAEFV1194H1Z2", paymentTermsDays: 30, leadTimeDays: 2, since: "2015-09-01",
    brandIds: ["brd-philips", "brd-havells", "brd-syska", "brd-nova"],
    sim: { priceFactor: 1.01, reliability: 0.96 },
  },
  {
    id: "ven-navkar", name: "Navkar Housewares", type: "distributor", city: "Surat", state: "Gujarat",
    contactPerson: "Hiren Sanghvi", phone: "+91 98795 08422", email: "navkarhousewares@mail.example",
    gstin: "24AAJFN3385M1ZS", paymentTermsDays: 30, leadTimeDays: 4, since: "2018-03-10",
    brandIds: ["brd-milton", "brd-cello", "brd-signoraware"],
    sim: { priceFactor: 0.99, reliability: 0.9 },
  },
  {
    id: "ven-ambika", name: "Ambika Traders", type: "wholesaler", city: "Vadodara", state: "Gujarat",
    contactPerson: "Rakesh Prajapati", phone: "+91 94265 77310", email: "ambikatraders.vdr@mail.example",
    gstin: "24ADPPP5532R1ZQ", paymentTermsDays: 7, leadTimeDays: 3, since: "2020-01-15",
    brandIds: ["brd-pigeon", "brd-butterfly", "brd-cello", "brd-milton", "brd-bajaj", "brd-signoraware", "brd-syska", "brd-usha", "brd-nova"],
    sim: { priceFactor: 0.955, reliability: 0.78 },
  },
  {
    id: "ven-craftora", name: "Craftora Décor Studio", type: "wholesaler", city: "Jaipur", state: "Rajasthan",
    contactPerson: "Meenal Agarwal", phone: "+91 98290 44617", email: "trade@craftora.example",
    gstin: "08AAICC4410P1ZT", paymentTermsDays: 30, leadTimeDays: 9, since: "2021-08-01",
    brandIds: ["brd-craftora", "brd-chumbak", "brd-ellementry"],
    sim: { priceFactor: 1.0, reliability: 0.85 },
  },
  {
    id: "ven-rangoli", name: "Rangoli Gift Packaging Co.", type: "manufacturer", city: "Ahmedabad", state: "Gujarat",
    contactPerson: "Pooja Desai", phone: "+91 97277 13904", email: "orders@rangoligifting.example",
    gstin: "24AAMFR8820C1ZJ", paymentTermsDays: 21, leadTimeDays: 6, since: "2019-09-01",
    brandIds: ["brd-rangoli"],
    sim: { priceFactor: 1.0, reliability: 0.9 },
  },
  {
    id: "ven-western", name: "Western India Brand Sales LLP", type: "brand-direct", city: "Mumbai", state: "Maharashtra",
    contactPerson: "Aditi Kulkarni", phone: "+91 98190 26655", email: "west.trade@wibsllp.example",
    gstin: "27AAJFW6672E1ZN", paymentTermsDays: 45, leadTimeDays: 8, since: "2022-04-01",
    brandIds: ["brd-wonderchef", "brd-morphy", "brd-borosil", "brd-larah", "brd-laopala", "brd-philips"],
    sim: { priceFactor: 0.975, reliability: 0.86 },
  },
];

/** Vendor offers on purchases — festive, volume and scheme terms as stated by vendors. */
export const vendorOffers: VendorOffer[] = [
  // Historic (used by past purchases)
  { id: "off-2025-prs-diwali", vendorId: "ven-ganesh", title: "Prestige Diwali Dhamaka 2025", type: "festive", festival: "Diwali 2025", description: "Festive trade discount on Prestige cookers and induction.", productIds: ["prd-001", "prd-005", "prd-013", "prd-014", "prd-019"], benefit: { kind: "percent", value: 7 }, minQty: 6, startsOn: "2025-09-10", endsOn: "2025-10-25" },
  { id: "off-2025-mil-festive", vendorId: "ven-navkar", title: "Milton Festive Gifting Scheme", type: "festive", festival: "Diwali 2025", description: "Flat per-unit discount on Milton gift sets and casseroles.", productIds: ["prd-032", "prd-062", "prd-029"], benefit: { kind: "flat-per-unit", value: 55 }, minQty: 12, startsOn: "2025-09-15", endsOn: "2025-10-20" },
  { id: "off-2026-hav-winter", vendorId: "ven-mehta", title: "Havells Winter Stock-up", type: "scheme", description: "Free unit on room heaters ahead of winter.", productIds: ["prd-052"], benefit: { kind: "free-units", buy: 10, free: 1 }, minQty: 10, startsOn: "2025-10-15", endsOn: "2025-12-15" },
  { id: "off-2026-ush-summer", vendorId: "ven-mehta", title: "Usha & Bajaj Summer Fan Scheme", type: "scheme", description: "Pre-summer discount on fans.", productIds: ["prd-053", "prd-054"], benefit: { kind: "percent", value: 6 }, minQty: 10, startsOn: "2026-02-15", endsOn: "2026-04-30" },
  { id: "off-2026-lar-wedding", vendorId: "ven-sai", title: "Larah Wedding Season Offer", type: "festive", festival: "Wedding season", description: "Discount on Larah and La Opala dinner sets for wedding season.", productIds: ["prd-021", "prd-022", "prd-028"], benefit: { kind: "percent", value: 8 }, minQty: 8, startsOn: "2025-11-01", endsOn: "2026-02-28" },

  // Current & upcoming (relative to the data's as-of date)
  { id: "off-2026-prs-diwali", vendorId: "ven-ganesh", title: "Prestige Diwali Dhamaka 2026", type: "festive", festival: "Diwali 2026", description: "Festive trade discount on Prestige cookers, induction and mixer grinders.", productIds: ["prd-001", "prd-005", "prd-013", "prd-014", "prd-019"], benefit: { kind: "percent", value: 8 }, minQty: 6, startsOn: "2026-09-15", endsOn: "2026-10-31", terms: "Valid on invoices raised within the window. Not combinable with volume slabs." },
  { id: "off-2026-phi-festive", vendorId: "ven-vardhman", title: "Philips Festive Trade Scheme", type: "festive", festival: "Diwali 2026", description: "One trimmer free for every ten purchased.", productIds: ["prd-045", "prd-047"], benefit: { kind: "free-units", buy: 10, free: 1 }, minQty: 10, startsOn: "2026-09-20", endsOn: "2026-11-10" },
  { id: "off-2026-lao-diwali", vendorId: "ven-sai", title: "La Opala & Larah Diwali Offer", type: "festive", festival: "Diwali 2026", description: "Festive discount on dinner sets.", productIds: ["prd-021", "prd-022", "prd-024"], benefit: { kind: "percent", value: 12 }, minQty: 10, startsOn: "2026-10-03", endsOn: "2026-10-28" },
  { id: "off-2026-mil-flask", vendorId: "ven-navkar", title: "Milton Flask Festive Price", type: "festive", festival: "Navratri 2026", description: "Flat discount per unit on Thermosteel flasks and gift sets.", productIds: ["prd-029", "prd-062"], benefit: { kind: "flat-per-unit", value: 60 }, minQty: 24, startsOn: "2026-09-01", endsOn: "2026-10-06" },
  { id: "off-2026-baj-volume", vendorId: "ven-mehta", title: "Bajaj Volume Slab", type: "volume", description: "Volume discount on Bajaj appliances above 30 units per invoice.", productIds: ["prd-002", "prd-050", "prd-054"], benefit: { kind: "percent", value: 5 }, minQty: 30, startsOn: "2026-07-01", endsOn: "2026-12-31" },
  { id: "off-2026-mor-clear", vendorId: "ven-western", title: "Morphy Richards OTG Clearance", type: "clearance", description: "Vendor clearing older OTG stock.", productIds: ["prd-007"], benefit: { kind: "percent", value: 15 }, startsOn: "2026-08-01", endsOn: "2026-10-15" },
  { id: "off-2026-ran-corp", vendorId: "ven-rangoli", title: "Corporate Diwali Gifting Rates", type: "festive", festival: "Diwali 2026", description: "Special rates on hampers and corporate sets for bulk festive orders.", productIds: ["prd-057", "prd-058", "prd-060"], benefit: { kind: "percent", value: 10 }, minQty: 25, startsOn: "2026-09-10", endsOn: "2026-11-05" },
  { id: "off-2026-cra-diya", vendorId: "ven-craftora", title: "Craftora Festive Décor Pack", type: "festive", festival: "Diwali 2026", description: "Free units on diyas, thalis and string lights.", productIds: ["prd-039", "prd-042", "prd-043"], benefit: { kind: "free-units", buy: 12, free: 2 }, minQty: 12, startsOn: "2026-09-25", endsOn: "2026-11-01" },
  { id: "off-2026-won-launch", vendorId: "ven-western", title: "Wonderchef Granite Range Push", type: "launch", description: "Introductory trade price on granite cookware.", productIds: ["prd-017"], benefit: { kind: "percent", value: 10 }, minQty: 12, startsOn: "2026-10-10", endsOn: "2026-11-30" },
];
