import DashboardHero from "./DashboardHero";
import RecentSessions from "./RecentSessions";
import QuickActions from "./QuickActions";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardPage() {
  return (
    <div className="h-[calc(100%-3.5rem)]">
      <div className="bg-[#0b1220] overflow-y-auto custom-scrollbar lg:mr-80 h-full">
        <div className="p-6 flex flex-col gap-8 max-w-5xl mx-auto w-full">
          <DashboardHero />
          <RecentSessions />
          <QuickActions />
        </div>
      </div>
      <DashboardSidebar />
    </div>
  );
}