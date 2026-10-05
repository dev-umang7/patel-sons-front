/**
 * DUMMY DATA — master catalogue.
 * ASSUMPTION: Patel & Sons is modelled as a home, kitchen & gifting retailer in
 * Vadodara. The real catalogue is unknown; replace this file when it is.
 *
 * `sim` fields are generator inputs only (demand profile, cost ratio). They are
 * stripped before data reaches the data-access layer; movement classes shown in
 * the UI are *calculated* from the resulting sales, not read from here.
 */
import type { Brand, Category, GiftOccasion, Product, ProductUnit } from "@/data-access/types/catalog";

export const categories: Category[] = [
  { id: "cat-kitchen", slug: "kitchen-appliances", name: "Kitchen Appliances", description: "Mixer grinders, kettles, induction, air fryers and small cooking appliances." },
  { id: "cat-cookware", slug: "cookware", name: "Cookware", description: "Pressure cookers, tawas, kadhais and cookware sets." },
  { id: "cat-dinnerware", slug: "dinnerware", name: "Dinnerware & Serveware", description: "Dinner sets, glassware, tea sets and serving bowls." },
  { id: "cat-storage", slug: "storage", name: "Storage & Bottles", description: "Flasks, bottles, lunch boxes and kitchen storage." },
  { id: "cat-decor", slug: "home-decor", name: "Home Décor", description: "Cushions, planters, clocks, diyas and festive décor." },
  { id: "cat-personal", slug: "personal-care", name: "Personal Care", description: "Trimmers, hair dryers and styling appliances." },
  { id: "cat-comfort", slug: "home-comfort", name: "Home Comfort", description: "Irons, fans, heaters and lighting." },
  { id: "cat-gifts", slug: "gift-sets", name: "Gift Sets & Hampers", description: "Ready gift sets and festive hampers." },
];

export const brands: Brand[] = [
  { id: "brd-prestige", slug: "prestige", name: "Prestige", description: "Cookware and kitchen appliances." },
  { id: "brd-pigeon", slug: "pigeon", name: "Pigeon", description: "Value kitchen appliances and cookware." },
  { id: "brd-bajaj", slug: "bajaj", name: "Bajaj", description: "Home appliances, fans and irons." },
  { id: "brd-philips", slug: "philips", name: "Philips", description: "Kitchen, personal care and home comfort appliances." },
  { id: "brd-havells", slug: "havells", name: "Havells", description: "Fans, heaters and personal care." },
  { id: "brd-usha", slug: "usha", name: "Usha", description: "Fans and small appliances." },
  { id: "brd-borosil", slug: "borosil", name: "Borosil", description: "Glassware and storage." },
  { id: "brd-larah", slug: "larah", name: "Larah by Borosil", description: "Opalware dinner sets." },
  { id: "brd-laopala", slug: "la-opala", name: "La Opala", description: "Premium opalware." },
  { id: "brd-milton", slug: "milton", name: "Milton", description: "Flasks, bottles and casseroles." },
  { id: "brd-cello", slug: "cello", name: "Cello", description: "Storage, bottles and opalware." },
  { id: "brd-signoraware", slug: "signoraware", name: "Signoraware", description: "Lunch boxes and containers." },
  { id: "brd-hawkins", slug: "hawkins", name: "Hawkins", description: "Pressure cookers and cookware." },
  { id: "brd-butterfly", slug: "butterfly", name: "Butterfly", description: "Cookware and appliances." },
  { id: "brd-wonderchef", slug: "wonderchef", name: "Wonderchef", description: "Cookware and kitchen appliances." },
  { id: "brd-morphy", slug: "morphy-richards", name: "Morphy Richards", description: "Ovens and kitchen appliances." },
  { id: "brd-nova", slug: "nova", name: "Nova", description: "Value personal care." },
  { id: "brd-syska", slug: "syska", name: "Syska", description: "LED lighting." },
  { id: "brd-chumbak", slug: "chumbak", name: "Chumbak", description: "Design-led home décor." },
  { id: "brd-ellementry", slug: "ellementry", name: "Ellementry", description: "Terracotta and ceramic décor." },
  { id: "brd-craftora", slug: "craftora", name: "Craftora", description: "Brass, wood and festive décor." },
  { id: "brd-rangoli", slug: "rangoli-gifting", name: "Rangoli Gifting", description: "Assembled gift sets and hampers." },
];

export type DemandSeason = "diwali" | "winter" | "summer" | "wedding";
export type DemandTrend = "steady" | "declining" | "fading" | "rising";

export interface ProductSeed extends Product {
  sim: {
    /** Base units per day before seasonality. */
    demand: number;
    season?: DemandSeason;
    trend?: DemandTrend;
    /** Typical landed cost as a share of selling price. */
    costRatio: number;
    /** Over-stocked at the start of history (drives slow/dead stock). */
    overstock?: number;
    /** Management stopped re-ordering after this date. */
    stopReorderAfter?: string;
  };
}

interface Seed {
  n: number;
  sku: string;
  name: string;
  cat: string;
  brand: string;
  mrp: number;
  price: number;
  unit?: ProductUnit;
  hsn: string;
  gst: number;
  reorder: number;
  occasions?: GiftOccasion[];
  attrs: Record<string, string>;
  desc: string;
  introduced?: string;
  sim: ProductSeed["sim"];
}

function product(s: Seed): ProductSeed {
  return {
    id: `prd-${String(s.n).padStart(3, "0")}`,
    sku: s.sku,
    name: s.name,
    categoryId: s.cat,
    brandId: s.brand,
    unit: s.unit ?? "pc",
    mrp: s.mrp,
    sellingPrice: s.price,
    hsn: s.hsn,
    gstRate: s.gst,
    status: "active",
    reorderLevel: s.reorder,
    giftable: (s.occasions?.length ?? 0) > 0,
    giftOccasions: s.occasions ?? [],
    introducedOn: s.introduced ?? "2024-04-01",
    description: s.desc,
    attributes: s.attrs,
    sim: s.sim,
  };
}

export const productSeeds: ProductSeed[] = [
  // Kitchen Appliances
  product({ n: 1, sku: "KA-PRS-IRIS750", name: "Prestige Iris 750W Mixer Grinder", cat: "cat-kitchen", brand: "brd-prestige", mrp: 4295, price: 3499, hsn: "8509", gst: 18, reorder: 8, occasions: ["wedding", "housewarming"], attrs: { Power: "750 W", Jars: "3 + juicer", Warranty: "2 years" }, desc: "Three-jar mixer grinder with juicer attachment.", sim: { demand: 0.62, costRatio: 0.74, season: "wedding" } }),
  product({ n: 2, sku: "KA-BAJ-REX500", name: "Bajaj Rex 500W Mixer Grinder", cat: "cat-kitchen", brand: "brd-bajaj", mrp: 2899, price: 2299, hsn: "8509", gst: 18, reorder: 8, attrs: { Power: "500 W", Jars: "3", Warranty: "2 years" }, desc: "Compact everyday mixer grinder.", sim: { demand: 0.7, costRatio: 0.76 } }),
  product({ n: 3, sku: "KA-PHI-HL7756", name: "Philips HL7756 Mixer Grinder", cat: "cat-kitchen", brand: "brd-philips", mrp: 5195, price: 4299, hsn: "8509", gst: 18, reorder: 5, occasions: ["wedding"], attrs: { Power: "750 W", Jars: "3", Warranty: "2 years" }, desc: "Turbo motor mixer grinder with stainless jars.", sim: { demand: 0.3, costRatio: 0.75 } }),
  product({ n: 4, sku: "KA-PIG-KESSEL15", name: "Pigeon Kessel 1.5 L Electric Kettle", cat: "cat-kitchen", brand: "brd-pigeon", mrp: 1095, price: 649, hsn: "8516", gst: 18, reorder: 12, occasions: ["birthday", "corporate"], attrs: { Capacity: "1.5 L", Power: "1500 W" }, desc: "Stainless steel cordless kettle.", sim: { demand: 0.85, costRatio: 0.7 } }),
  product({ n: 5, sku: "KA-PRS-PIC20", name: "Prestige PIC 20 Induction Cooktop", cat: "cat-kitchen", brand: "brd-prestige", mrp: 3299, price: 2599, hsn: "8516", gst: 18, reorder: 6, occasions: ["housewarming"], attrs: { Power: "1600 W", Presets: "Indian menu" }, desc: "Induction cooktop with Indian menu options.", sim: { demand: 0.32, costRatio: 0.74 } }),
  product({ n: 6, sku: "KA-PHI-HD9252", name: "Philips HD9252 Air Fryer 4.1 L", cat: "cat-kitchen", brand: "brd-philips", mrp: 9995, price: 7999, hsn: "8516", gst: 18, reorder: 4, occasions: ["wedding", "housewarming", "anniversary"], attrs: { Capacity: "4.1 L", Power: "1400 W" }, desc: "Rapid Air technology air fryer.", introduced: "2025-06-01", sim: { demand: 0.2, costRatio: 0.78, trend: "rising" } }),
  product({ n: 7, sku: "KA-MOR-OTG28", name: "Morphy Richards OTG 28 L", cat: "cat-kitchen", brand: "brd-morphy", mrp: 9500, price: 7499, hsn: "8516", gst: 18, reorder: 3, occasions: ["wedding"], attrs: { Capacity: "28 L", Power: "1500 W" }, desc: "Oven toaster grill with rotisserie.", sim: { demand: 0.05, costRatio: 0.77, overstock: 14, trend: "declining" } }),
  product({ n: 8, sku: "KA-WON-NUTRI400", name: "Wonderchef Nutri-Blend 400W", cat: "cat-kitchen", brand: "brd-wonderchef", mrp: 4000, price: 2799, hsn: "8509", gst: 18, reorder: 4, attrs: { Power: "400 W", Jars: "2" }, desc: "Personal blender for smoothies and chutneys.", sim: { demand: 0.07, costRatio: 0.7, overstock: 12 } }),
  product({ n: 9, sku: "KA-BAJ-MAJTOAST", name: "Bajaj Majesty Pop-up Toaster", cat: "cat-kitchen", brand: "brd-bajaj", mrp: 2050, price: 1499, hsn: "8516", gst: 18, reorder: 4, attrs: { Slices: "2", Power: "750 W" }, desc: "Two-slice pop-up toaster with crumb tray.", sim: { demand: 0.05, costRatio: 0.72, overstock: 16, trend: "fading", stopReorderAfter: "2025-12-31" } }),
  product({ n: 10, sku: "KA-USH-SAND1000", name: "Usha 1000W Sandwich Maker", cat: "cat-kitchen", brand: "brd-usha", mrp: 1890, price: 1299, hsn: "8516", gst: 18, reorder: 4, attrs: { Power: "1000 W", Plates: "Grill" }, desc: "Grill sandwich maker with non-stick plates.", sim: { demand: 0.035, costRatio: 0.74, overstock: 22, trend: "fading", stopReorderAfter: "2025-10-15" } }),
  product({ n: 11, sku: "KA-HAV-RICE18", name: "Havells Electric Rice Cooker 1.8 L", cat: "cat-kitchen", brand: "brd-havells", mrp: 3695, price: 2899, hsn: "8516", gst: 18, reorder: 3, attrs: { Capacity: "1.8 L", Power: "700 W" }, desc: "Automatic rice cooker with keep-warm.", sim: { demand: 0.06, costRatio: 0.76, overstock: 10 } }),

  // Cookware
  product({ n: 12, sku: "CW-HAW-CLASSIC5", name: "Hawkins Classic 5 L Pressure Cooker", cat: "cat-cookware", brand: "brd-hawkins", mrp: 2700, price: 2450, hsn: "7615", gst: 12, reorder: 10, occasions: ["wedding", "housewarming"], attrs: { Capacity: "5 L", Material: "Aluminium" }, desc: "Inner-lid aluminium pressure cooker.", sim: { demand: 0.78, costRatio: 0.82, season: "wedding" } }),
  product({ n: 13, sku: "CW-PRS-POP3", name: "Prestige Popular 3 L Pressure Cooker", cat: "cat-cookware", brand: "brd-prestige", mrp: 1925, price: 1650, hsn: "7615", gst: 12, reorder: 10, occasions: ["housewarming"], attrs: { Capacity: "3 L", Material: "Aluminium" }, desc: "Outer-lid pressure cooker for daily cooking.", sim: { demand: 0.72, costRatio: 0.8 } }),
  product({ n: 14, sku: "CW-PRS-OMEGA28", name: "Prestige Omega Deluxe Tawa 28 cm", cat: "cat-cookware", brand: "brd-prestige", mrp: 1595, price: 1195, hsn: "7615", gst: 12, reorder: 6, attrs: { Size: "28 cm", Coating: "Non-stick" }, desc: "Granite-finish non-stick flat tawa.", sim: { demand: 0.34, costRatio: 0.72 } }),
  product({ n: 15, sku: "CW-PIG-SET3", name: "Pigeon Non-stick Cookware Set (3 pc)", cat: "cat-cookware", brand: "brd-pigeon", mrp: 2495, price: 1499, unit: "set", hsn: "7615", gst: 12, reorder: 6, occasions: ["housewarming", "wedding"], attrs: { Pieces: "Tawa, kadhai, fry pan" }, desc: "Induction-base non-stick starter set.", sim: { demand: 0.3, costRatio: 0.68 } }),
  product({ n: 16, sku: "CW-HAW-FUTKAD25", name: "Hawkins Futura Kadhai 2.5 L", cat: "cat-cookware", brand: "brd-hawkins", mrp: 2450, price: 2190, hsn: "7615", gst: 12, reorder: 5, attrs: { Capacity: "2.5 L", Material: "Hard anodised" }, desc: "Hard-anodised kadhai with glass lid.", sim: { demand: 0.24, costRatio: 0.81 } }),
  product({ n: 17, sku: "CW-WON-GRAN24", name: "Wonderchef Granite Fry Pan 24 cm", cat: "cat-cookware", brand: "brd-wonderchef", mrp: 2100, price: 1299, hsn: "7615", gst: 12, reorder: 4, attrs: { Size: "24 cm", Coating: "Granite" }, desc: "Granite-coated fry pan, induction base.", sim: { demand: 0.07, costRatio: 0.66, overstock: 18 } }),
  product({ n: 18, sku: "CW-BUT-TRI24", name: "Butterfly Triply Kadai 24 cm", cat: "cat-cookware", brand: "brd-butterfly", mrp: 2500, price: 1799, hsn: "7323", gst: 12, reorder: 5, attrs: { Size: "24 cm", Material: "Tri-ply steel" }, desc: "Tri-ply stainless steel kadai.", sim: { demand: 0.22, costRatio: 0.72 } }),
  product({ n: 19, sku: "CW-PRS-SVACHH5", name: "Prestige Svachh 5 L Pressure Cooker", cat: "cat-cookware", brand: "brd-prestige", mrp: 2895, price: 2350, hsn: "7615", gst: 12, reorder: 6, occasions: ["wedding"], attrs: { Capacity: "5 L", Feature: "Spillage control lid" }, desc: "Pressure cooker with deep lid for spill control.", sim: { demand: 0.28, costRatio: 0.79 } }),
  product({ n: 20, sku: "CW-HAW-CONT3", name: "Hawkins Contura Black 3 L", cat: "cat-cookware", brand: "brd-hawkins", mrp: 2790, price: 2575, hsn: "7615", gst: 12, reorder: 3, occasions: ["wedding"], attrs: { Capacity: "3 L", Material: "Hard anodised" }, desc: "Contoured hard-anodised pressure cooker.", sim: { demand: 0.08, costRatio: 0.83, overstock: 9 } }),

  // Dinnerware & Serveware
  product({ n: 21, sku: "DW-LAO-DIVA27", name: "La Opala Diva Classique Dinner Set 27 pc", cat: "cat-dinnerware", brand: "brd-laopala", mrp: 6250, price: 4999, unit: "set", hsn: "7013", gst: 12, reorder: 4, occasions: ["wedding", "anniversary", "housewarming", "diwali"], attrs: { Pieces: "27", Material: "Opalware" }, desc: "Opalware dinner set for six.", sim: { demand: 0.2, costRatio: 0.74, season: "wedding" } }),
  product({ n: 22, sku: "DW-LAR-MOON35", name: "Larah Moon Dinner Set 35 pc", cat: "cat-dinnerware", brand: "brd-larah", mrp: 5190, price: 3999, unit: "set", hsn: "7013", gst: 12, reorder: 4, occasions: ["wedding", "anniversary", "diwali"], attrs: { Pieces: "35", Material: "Opalware" }, desc: "Tempered opalware dinner set for six.", sim: { demand: 0.24, costRatio: 0.73, season: "wedding" } }),
  product({ n: 23, sku: "DW-BOR-VIS6", name: "Borosil Vision Glass Set of 6", cat: "cat-dinnerware", brand: "brd-borosil", mrp: 795, price: 649, unit: "set", hsn: "7013", gst: 12, reorder: 12, occasions: ["corporate", "housewarming"], attrs: { Capacity: "350 ml", Pieces: "6" }, desc: "Microwave-safe borosilicate tumblers.", sim: { demand: 0.68, costRatio: 0.72 } }),
  product({ n: 24, sku: "DW-CEL-DAZ18", name: "Cello Dazzle Opalware Dinner Set 18 pc", cat: "cat-dinnerware", brand: "brd-cello", mrp: 3090, price: 2199, unit: "set", hsn: "7013", gst: 12, reorder: 4, occasions: ["housewarming", "diwali"], attrs: { Pieces: "18", Material: "Opalware" }, desc: "Everyday opalware dinner set for four.", sim: { demand: 0.22, costRatio: 0.7 } }),
  product({ n: 25, sku: "DW-BOR-BOWL3", name: "Borosil Mixing Bowl Set (3 pc)", cat: "cat-dinnerware", brand: "brd-borosil", mrp: 1350, price: 999, unit: "set", hsn: "7013", gst: 12, reorder: 4, attrs: { Pieces: "3", Material: "Borosilicate" }, desc: "Microwave-safe glass mixing bowls.", sim: { demand: 0.08, costRatio: 0.71, overstock: 14 } }),
  product({ n: 26, sku: "DW-LAO-MUG6", name: "La Opala Sovrana Mug Set of 6", cat: "cat-dinnerware", brand: "brd-laopala", mrp: 1150, price: 899, unit: "set", hsn: "7013", gst: 12, reorder: 4, occasions: ["corporate", "birthday"], attrs: { Pieces: "6", Material: "Opalware" }, desc: "Opalware coffee mugs.", sim: { demand: 0.09, costRatio: 0.72, overstock: 12 } }),
  product({ n: 27, sku: "DW-CEL-TEA15", name: "Cello Royal Bone China Tea Set 15 pc", cat: "cat-dinnerware", brand: "brd-cello", mrp: 3490, price: 2799, unit: "set", hsn: "6911", gst: 12, reorder: 3, occasions: ["anniversary"], attrs: { Pieces: "15", Material: "Bone china" }, desc: "Gold-rimmed bone china tea set.", sim: { demand: 0.03, costRatio: 0.73, overstock: 15, trend: "fading", stopReorderAfter: "2025-10-10" } }),
  product({ n: 28, sku: "DW-LAR-SERVE4", name: "Larah Serving Bowl Set of 4", cat: "cat-dinnerware", brand: "brd-larah", mrp: 1050, price: 799, unit: "set", hsn: "7013", gst: 12, reorder: 5, occasions: ["housewarming", "diwali"], attrs: { Pieces: "4", Material: "Opalware" }, desc: "Serving bowls with lids.", sim: { demand: 0.26, costRatio: 0.71 } }),

  // Storage & Bottles
  product({ n: 29, sku: "SB-MIL-FLASK1", name: "Milton Thermosteel Flip Lid Flask 1 L", cat: "cat-storage", brand: "brd-milton", mrp: 1345, price: 1099, hsn: "9617", gst: 18, reorder: 14, occasions: ["corporate", "birthday"], attrs: { Capacity: "1 L", Insulation: "24 hr hot & cold" }, desc: "Vacuum-insulated stainless flask.", sim: { demand: 0.88, costRatio: 0.73 } }),
  product({ n: 30, sku: "SB-CEL-CHK18", name: "Cello Checkers Canister Set of 18", cat: "cat-storage", brand: "brd-cello", mrp: 1299, price: 899, unit: "set", hsn: "3924", gst: 18, reorder: 10, attrs: { Pieces: "18", Material: "PET" }, desc: "Stackable airtight kitchen canisters.", sim: { demand: 0.6, costRatio: 0.66 } }),
  product({ n: 31, sku: "SB-SIG-EXEC", name: "Signoraware Executive Lunch Box", cat: "cat-storage", brand: "brd-signoraware", mrp: 785, price: 599, hsn: "3924", gst: 18, reorder: 12, attrs: { Containers: "3 + bag" }, desc: "Microwave-safe lunch box with insulated bag.", sim: { demand: 0.74, costRatio: 0.68 } }),
  product({ n: 32, sku: "SB-MIL-CASS3", name: "Milton Pacific Casserole Set (3 pc)", cat: "cat-storage", brand: "brd-milton", mrp: 1795, price: 1349, unit: "set", hsn: "3924", gst: 18, reorder: 6, occasions: ["wedding", "housewarming", "diwali"], attrs: { Pieces: "3", Insulation: "Double wall" }, desc: "Insulated casseroles for serving.", sim: { demand: 0.3, costRatio: 0.7, season: "diwali" } }),
  product({ n: 33, sku: "SB-BOR-KLIP4", name: "Borosil Klip N Store Set of 4", cat: "cat-storage", brand: "brd-borosil", mrp: 1690, price: 1199, unit: "set", hsn: "7013", gst: 12, reorder: 6, attrs: { Pieces: "4", Material: "Glass" }, desc: "Glass containers with locking lids.", sim: { demand: 0.26, costRatio: 0.71 } }),
  product({ n: 34, sku: "SB-CEL-H2O1", name: "Cello H2O Steel Bottle 1 L", cat: "cat-storage", brand: "brd-cello", mrp: 599, price: 449, hsn: "7323", gst: 12, reorder: 15, occasions: ["corporate"], attrs: { Capacity: "1 L", Material: "Stainless steel" }, desc: "Single-wall steel water bottle.", sim: { demand: 0.95, costRatio: 0.67, season: "summer" } }),
  product({ n: 35, sku: "SB-SIG-MOD5", name: "Signoraware Modular Container Set of 5", cat: "cat-storage", brand: "brd-signoraware", mrp: 950, price: 699, unit: "set", hsn: "3924", gst: 18, reorder: 5, attrs: { Pieces: "5" }, desc: "Modular stackable containers.", sim: { demand: 0.08, costRatio: 0.66, overstock: 16 } }),
  product({ n: 36, sku: "SB-MIL-EXEC3", name: "Milton Executive Lunch Box (3 container)", cat: "cat-storage", brand: "brd-milton", mrp: 1050, price: 799, hsn: "7323", gst: 12, reorder: 8, attrs: { Containers: "3", Material: "Steel + insulated" }, desc: "Insulated steel lunch box.", sim: { demand: 0.36, costRatio: 0.7 } }),

  // Home Décor
  product({ n: 37, sku: "HD-CHU-CUSH5", name: "Chumbak Teal Cushion Cover Set of 5", cat: "cat-decor", brand: "brd-chumbak", mrp: 1995, price: 1499, unit: "set", hsn: "6304", gst: 12, reorder: 4, occasions: ["housewarming", "birthday"], attrs: { Size: "16 × 16 in", Pieces: "5" }, desc: "Printed cotton cushion covers.", sim: { demand: 0.07, costRatio: 0.62, overstock: 12 } }),
  product({ n: 38, sku: "HD-ELL-TERRA-M", name: "Ellementry Terracotta Planter (Medium)", cat: "cat-decor", brand: "brd-ellementry", mrp: 1490, price: 1250, hsn: "6913", gst: 12, reorder: 3, occasions: ["housewarming"], attrs: { Height: "22 cm", Material: "Terracotta" }, desc: "Hand-finished terracotta planter.", sim: { demand: 0.06, costRatio: 0.6, overstock: 10 } }),
  product({ n: 39, sku: "HD-CRA-DIYA5", name: "Craftora Brass Diya Set of 5", cat: "cat-decor", brand: "brd-craftora", mrp: 1200, price: 899, unit: "set", hsn: "7418", gst: 12, reorder: 6, occasions: ["diwali", "pooja", "housewarming"], attrs: { Pieces: "5", Material: "Brass" }, desc: "Hand-polished brass diyas.", sim: { demand: 0.12, costRatio: 0.58, season: "diwali" } }),
  product({ n: 40, sku: "HD-CHU-CLOCK", name: "Chumbak Indian Summer Wall Clock", cat: "cat-decor", brand: "brd-chumbak", mrp: 2495, price: 1995, hsn: "9105", gst: 18, reorder: 2, occasions: ["housewarming"], attrs: { Diameter: "30 cm" }, desc: "Illustrated MDF wall clock.", sim: { demand: 0.025, costRatio: 0.6, overstock: 11, trend: "fading", stopReorderAfter: "2025-10-01" } }),
  product({ n: 41, sku: "HD-ELL-VASE2", name: "Ellementry Ceramic Vase Set of 2", cat: "cat-decor", brand: "brd-ellementry", mrp: 2190, price: 1850, unit: "set", hsn: "6913", gst: 12, reorder: 2, occasions: ["anniversary", "housewarming"], attrs: { Pieces: "2", Material: "Ceramic" }, desc: "Glazed ceramic vases.", sim: { demand: 0.05, costRatio: 0.6, overstock: 8 } }),
  product({ n: 42, sku: "HD-CRA-THALI", name: "Craftora Hand-painted Pooja Thali", cat: "cat-decor", brand: "brd-craftora", mrp: 999, price: 749, hsn: "4419", gst: 12, reorder: 6, occasions: ["diwali", "pooja", "wedding"], attrs: { Diameter: "30 cm", Material: "Sheesham wood" }, desc: "Hand-painted wooden pooja thali set.", sim: { demand: 0.1, costRatio: 0.56, season: "diwali" } }),
  product({ n: 43, sku: "HD-CRA-LED10", name: "Craftora LED String Lights 10 m", cat: "cat-decor", brand: "brd-craftora", mrp: 599, price: 349, hsn: "9405", gst: 18, reorder: 20, occasions: ["diwali"], attrs: { Length: "10 m", Colour: "Warm white" }, desc: "Warm-white festive string lights.", sim: { demand: 0.2, costRatio: 0.5, season: "diwali" } }),
  product({ n: 44, sku: "HD-CHU-COAST6", name: "Chumbak Coaster Set of 6", cat: "cat-decor", brand: "brd-chumbak", mrp: 799, price: 599, unit: "set", hsn: "4419", gst: 12, reorder: 5, occasions: ["corporate", "birthday", "housewarming"], attrs: { Pieces: "6", Material: "MDF" }, desc: "Printed MDF coasters with holder.", sim: { demand: 0.2, costRatio: 0.58 } }),

  // Personal Care
  product({ n: 45, sku: "PC-PHI-BT3221", name: "Philips BT3221 Beard Trimmer", cat: "cat-personal", brand: "brd-philips", mrp: 2195, price: 1599, hsn: "8510", gst: 18, reorder: 8, occasions: ["birthday"], attrs: { Runtime: "60 min", Settings: "20 lengths" }, desc: "Cordless beard trimmer with lift-and-trim.", sim: { demand: 0.55, costRatio: 0.74 } }),
  product({ n: 46, sku: "PC-PHI-HP8100", name: "Philips HP8100 Hair Dryer", cat: "cat-personal", brand: "brd-philips", mrp: 1295, price: 999, hsn: "8516", gst: 18, reorder: 6, occasions: ["birthday"], attrs: { Power: "1000 W", Settings: "2" }, desc: "Compact foldable hair dryer.", sim: { demand: 0.33, costRatio: 0.74 } }),
  product({ n: 47, sku: "PC-PHI-BHS397", name: "Philips BHS397 Hair Straightener", cat: "cat-personal", brand: "brd-philips", mrp: 2795, price: 1999, hsn: "8516", gst: 18, reorder: 5, occasions: ["birthday"], attrs: { Plates: "Keratin ceramic" }, desc: "Kerashine straightener with temperature control.", sim: { demand: 0.25, costRatio: 0.73 } }),
  product({ n: 48, sku: "PC-HAV-HD3151", name: "Havells HD3151 Hair Dryer 1200W", cat: "cat-personal", brand: "brd-havells", mrp: 1995, price: 1299, hsn: "8516", gst: 18, reorder: 4, attrs: { Power: "1200 W" }, desc: "Hair dryer with cool-shot.", sim: { demand: 0.06, costRatio: 0.71, overstock: 11 } }),
  product({ n: 49, sku: "PC-NOV-NHT1047", name: "Nova NHT 1047 Trimmer", cat: "cat-personal", brand: "brd-nova", mrp: 1199, price: 699, hsn: "8510", gst: 18, reorder: 4, attrs: { Runtime: "45 min" }, desc: "Rechargeable cordless trimmer.", sim: { demand: 0.07, costRatio: 0.66, overstock: 14, trend: "declining" } }),

  // Home Comfort
  product({ n: 50, sku: "HC-BAJ-DX11", name: "Bajaj Majesty DX 11 Dry Iron", cat: "cat-comfort", brand: "brd-bajaj", mrp: 1040, price: 799, hsn: "8516", gst: 18, reorder: 10, attrs: { Power: "1000 W", Soleplate: "Non-stick" }, desc: "Lightweight dry iron.", sim: { demand: 0.62, costRatio: 0.74 } }),
  product({ n: 51, sku: "HC-PHI-GC1905", name: "Philips GC1905 Steam Iron", cat: "cat-comfort", brand: "brd-philips", mrp: 2595, price: 1999, hsn: "8516", gst: 18, reorder: 5, attrs: { Power: "1440 W", Steam: "Continuous" }, desc: "Steam iron with non-stick soleplate.", sim: { demand: 0.27, costRatio: 0.75 } }),
  product({ n: 52, sku: "HC-HAV-QUARTZ800", name: "Havells Quartz Room Heater 800W", cat: "cat-comfort", brand: "brd-havells", mrp: 2795, price: 1899, hsn: "8516", gst: 18, reorder: 5, attrs: { Power: "800 W", Rods: "2 quartz" }, desc: "Two-rod quartz heater with tip-over cut-off.", sim: { demand: 0.24, costRatio: 0.72, season: "winter" } }),
  product({ n: 53, sku: "HC-USH-MAXX400", name: "Usha Maxx Air 400 mm Table Fan", cat: "cat-comfort", brand: "brd-usha", mrp: 3190, price: 2499, hsn: "8414", gst: 18, reorder: 6, attrs: { Sweep: "400 mm", Speeds: "3" }, desc: "High-speed table fan with oscillation.", sim: { demand: 0.3, costRatio: 0.75, season: "summer" } }),
  product({ n: 54, sku: "HC-BAJ-ESTEEM1200", name: "Bajaj Esteem 1200 mm Ceiling Fan", cat: "cat-comfort", brand: "brd-bajaj", mrp: 2990, price: 2350, hsn: "8414", gst: 18, reorder: 6, occasions: ["housewarming"], attrs: { Sweep: "1200 mm", Rating: "BEE 3 star" }, desc: "Energy-efficient ceiling fan.", sim: { demand: 0.26, costRatio: 0.77, season: "summer" } }),
  product({ n: 55, sku: "HC-SYS-LED9X4", name: "Syska 9W LED Bulb (Pack of 4)", cat: "cat-comfort", brand: "brd-syska", mrp: 600, price: 399, unit: "pack", hsn: "8539", gst: 12, reorder: 20, attrs: { Wattage: "9 W", Pack: "4" }, desc: "Cool daylight LED bulbs.", sim: { demand: 0.92, costRatio: 0.64 } }),
  product({ n: 56, sku: "HC-HAV-AMBROSE", name: "Havells Ambrose 1200 mm Ceiling Fan", cat: "cat-comfort", brand: "brd-havells", mrp: 5225, price: 3850, hsn: "8414", gst: 18, reorder: 3, occasions: ["housewarming"], attrs: { Sweep: "1200 mm", Finish: "Decorative" }, desc: "Decorative ceiling fan with trims.", sim: { demand: 0.05, costRatio: 0.76, overstock: 9, trend: "declining" } }),

  // Gift Sets & Hampers
  product({ n: 57, sku: "GS-RAN-DIWALI", name: "Rangoli Diwali Dry Fruit & Diya Hamper", cat: "cat-gifts", brand: "brd-rangoli", mrp: 2999, price: 2499, unit: "set", hsn: "0813", gst: 12, reorder: 10, occasions: ["diwali", "corporate"], attrs: { Contents: "Dry fruits, 2 diyas, box" }, desc: "Festive hamper with dry fruits and brass diyas.", sim: { demand: 0.1, costRatio: 0.66, season: "diwali" } }),
  product({ n: 58, sku: "GS-RAN-CORP", name: "Rangoli Corporate Bottle & Diary Set", cat: "cat-gifts", brand: "brd-rangoli", mrp: 1499, price: 1199, unit: "set", hsn: "4820", gst: 12, reorder: 8, occasions: ["corporate"], attrs: { Contents: "Steel bottle, diary, pen" }, desc: "Branded-ready corporate gift set.", sim: { demand: 0.3, costRatio: 0.64, season: "diwali" } }),
  product({ n: 59, sku: "GS-RAN-HOUSE", name: "Rangoli Housewarming Kitchen Hamper", cat: "cat-gifts", brand: "brd-rangoli", mrp: 4499, price: 3999, unit: "set", hsn: "7323", gst: 12, reorder: 3, occasions: ["housewarming"], attrs: { Contents: "Tawa, canisters, serving bowls" }, desc: "Curated kitchen essentials hamper.", sim: { demand: 0.06, costRatio: 0.7, overstock: 8 } }),
  product({ n: 60, sku: "GS-RAN-COPPER", name: "Rangoli Copper Bottle & Glass Gift Set", cat: "cat-gifts", brand: "brd-rangoli", mrp: 2199, price: 1799, unit: "set", hsn: "7418", gst: 12, reorder: 6, occasions: ["wedding", "anniversary", "corporate"], attrs: { Contents: "1 L bottle, 2 glasses" }, desc: "Hammered copper bottle with two glasses.", sim: { demand: 0.25, costRatio: 0.62, season: "wedding" } }),
  product({ n: 61, sku: "GS-BOR-JUGSET", name: "Borosil Glass Jug & Tumbler Gift Set", cat: "cat-gifts", brand: "brd-borosil", mrp: 1890, price: 1499, unit: "set", hsn: "7013", gst: 12, reorder: 5, occasions: ["wedding", "housewarming", "anniversary"], attrs: { Contents: "1.2 L jug, 4 tumblers" }, desc: "Glass jug with four tumblers in gift box.", sim: { demand: 0.22, costRatio: 0.72, season: "wedding" } }),
  product({ n: 62, sku: "GS-MIL-GIFT", name: "Milton Thermosteel Gift Set", cat: "cat-gifts", brand: "brd-milton", mrp: 2390, price: 1899, unit: "set", hsn: "9617", gst: 18, reorder: 5, occasions: ["corporate", "diwali", "birthday"], attrs: { Contents: "Flask, 2 tumblers" }, desc: "Flask with two insulated tumblers.", sim: { demand: 0.24, costRatio: 0.72, season: "diwali" } }),
  product({ n: 63, sku: "GS-PIG-FESTIVE", name: "Pigeon Festive Cookware Gift Pack", cat: "cat-gifts", brand: "brd-pigeon", mrp: 3195, price: 2199, unit: "set", hsn: "7615", gst: 12, reorder: 4, occasions: ["diwali", "wedding"], attrs: { Contents: "Kadhai, tawa, ladle set" }, desc: "Gift-boxed non-stick cookware trio.", sim: { demand: 0.06, costRatio: 0.67, overstock: 14 } }),
  product({ n: 64, sku: "GS-RAN-KUMKUM", name: "Rangoli Silver-plated Kumkum Box Set", cat: "cat-gifts", brand: "brd-rangoli", mrp: 1690, price: 1350, unit: "set", hsn: "7114", gst: 3, reorder: 3, occasions: ["wedding", "pooja"], attrs: { Contents: "2 kumkum boxes, tray" }, desc: "Silver-plated kumkum boxes on tray.", sim: { demand: 0.03, costRatio: 0.63, overstock: 13, trend: "fading", stopReorderAfter: "2025-11-01" } }),
];
