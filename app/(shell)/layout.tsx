"use client";

// The signed-in shell: sidebar, header, page content, the presenter menu,
// the working indicator, and the dictation panel. The dictation panel sits
// beside the page, under the header, as its own column when there is room.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/Shell/Sidebar";
import { Header } from "@/components/Shell/Header";
import { PresenterMenu } from "@/components/Presenter/PresenterMenu";
import { WorkingToast } from "@/components/Presenter/WorkingToast";
import { DictationPanel } from "@/components/Presenter/DictationPanel";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const loggedIn = useStore((s) => s.loggedIn);
  const router = useRouter();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/login");
  }, [ready, loggedIn, router]);

  if (!ready || !loggedIn) return <div className="py-20 text-center text-mut">Loading</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="flex min-h-0 flex-1">
          <main className="@container min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
          <DictationPanel />
        </div>
      </div>
      <WorkingToast />
      <PresenterMenu />
    </div>
  );
}
