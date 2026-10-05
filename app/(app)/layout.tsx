import { cookies } from "next/headers";
import { CommandMenu } from "@/components/layout/command-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar, SIDEBAR_COOKIE } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { metaRepository, reportRepository } from "@/data-access";
import { resolvePeriod } from "@/lib/period";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [cookieStore, meta] = await Promise.all([cookies(), metaRepository.getMeta()]);
  const period = resolvePeriod({}, meta.asOf);
  const dashboard = await reportRepository.getDashboard({ range: period, previous: period.previous, granularity: period.granularity });

  return (
    <div className="flex min-h-dvh">
      <Sidebar initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"} asOf={meta.asOf} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar alerts={dashboard.alerts} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
      <MobileNav asOf={meta.asOf} />
      <CommandMenu />
    </div>
  );
}
