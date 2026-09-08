"use client";

import { cn } from "@/lib/utils";
import { BatteryMedium, Signal, Wifi } from "lucide-react";

/** iPhone 15-style chassis */
export const IPHONE_BEZEL = 12;
export const IPHONE_STATUS_BAR = 48;
export const IPHONE_HOME_BAR = 26;
export const IPHONE_OUTER_RADIUS = 52;
export const IPHONE_SCREEN_RADIUS = 42;

/** iPad Pro-style chassis */
export const IPAD_BEZEL = 18;
export const IPAD_STATUS_BAR = 28;

export const BROWSER_CHROME_HEIGHT = 36;

export function getIPhoneOuterSize(screenWidth: number, screenHeight: number) {
  return {
    outerWidth: screenWidth + IPHONE_BEZEL * 2,
    outerHeight:
      IPHONE_BEZEL * 2 + IPHONE_STATUS_BAR + screenHeight + IPHONE_HOME_BAR,
  };
}

export function getIPadOuterSize(screenWidth: number, screenHeight: number) {
  return {
    outerWidth: screenWidth + IPAD_BEZEL * 2,
    outerHeight: IPAD_BEZEL * 2 + IPAD_STATUS_BAR + screenHeight,
  };
}

function StatusIcons() {
  return (
    <div className="flex items-center gap-1 text-neutral-900" aria-hidden>
      <Signal className="h-3 w-3" strokeWidth={2.5} />
      <Wifi className="h-3 w-3" strokeWidth={2.5} />
      <BatteryMedium className="h-3.5 w-3.5" strokeWidth={2.5} />
    </div>
  );
}

function IPhoneStatusBar() {
  return (
    <div
      className="relative shrink-0 bg-white"
      style={{ height: IPHONE_STATUS_BAR }}
    >
      <div className="flex h-full items-end justify-between px-7 pb-2">
        <span className="text-[11px] font-semibold tabular-nums text-neutral-900">9:41</span>
        <StatusIcons />
      </div>
      <div
        className="absolute left-1/2 top-[10px] h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        aria-hidden
      />
    </div>
  );
}

function IPhoneHomeIndicator() {
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-white"
      style={{ height: IPHONE_HOME_BAR }}
    >
      <div className="h-[5px] w-[120px] rounded-full bg-neutral-900/85" aria-hidden />
    </div>
  );
}

export function IPhoneFrame({
  screenWidth,
  screenHeight,
  children,
  className,
}: {
  screenWidth: number;
  screenHeight: number;
  children: React.ReactNode;
  className?: string;
}) {
  const frameWidth = screenWidth + IPHONE_BEZEL * 2;

  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: frameWidth }}
    >
      {/* Side buttons */}
      <div
        className="absolute -left-[3px] z-10 top-[22%] h-8 w-[3px] rounded-l-md bg-neutral-600"
        aria-hidden
      />
      <div
        className="absolute -left-[3px] z-10 top-[30%] h-[52px] w-[3px] rounded-l-md bg-neutral-600"
        aria-hidden
      />
      <div
        className="absolute -left-[3px] z-10 top-[42%] h-[52px] w-[3px] rounded-l-md bg-neutral-600"
        aria-hidden
      />
      <div
        className="absolute -right-[3px] z-10 top-[28%] h-[72px] w-[3px] rounded-r-md bg-neutral-600"
        aria-hidden
      />

      {/* Titanium-style body */}
      <div
        className="relative p-[12px] shadow-[0_28px_60px_-16px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]"
        style={{
          width: frameWidth,
          borderRadius: IPHONE_OUTER_RADIUS,
          background:
            "linear-gradient(160deg, #48484a 0%, #2c2c2e 38%, #1c1c1e 72%, #3a3a3c 100%)",
        }}
      >
        {/* Screen glass inset */}
        <div
          className="overflow-hidden bg-black ring-1 ring-black/80"
          style={{ borderRadius: IPHONE_SCREEN_RADIUS }}
        >
          <IPhoneStatusBar />
          <div
            className="overflow-hidden bg-white"
            style={{ width: screenWidth, height: screenHeight }}
          >
            {children}
          </div>
          <IPhoneHomeIndicator />
        </div>
      </div>
    </div>
  );
}

function IPadStatusBar() {
  return (
    <div
      className="flex shrink-0 items-center justify-between bg-[#f2f2f7] px-5"
      style={{ height: IPAD_STATUS_BAR }}
    >
      <span className="text-[11px] font-semibold tabular-nums text-neutral-900">9:41</span>
      <div
        className="h-2.5 w-2.5 rounded-full bg-neutral-800 ring-2 ring-neutral-600/40"
        aria-hidden
      />
      <StatusIcons />
    </div>
  );
}

export function IPadFrame({
  screenWidth,
  screenHeight,
  children,
  className,
}: {
  screenWidth: number;
  screenHeight: number;
  children: React.ReactNode;
  className?: string;
}) {
  const frameWidth = screenWidth + IPAD_BEZEL * 2;

  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: frameWidth }}
    >
      <div
        className="relative p-[18px] shadow-[0_24px_48px_-14px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]"
        style={{
          width: frameWidth,
          borderRadius: 28,
          background:
            "linear-gradient(165deg, #3d3d3f 0%, #252527 45%, #1a1a1c 100%)",
        }}
      >
        <div
          className="overflow-hidden bg-black ring-1 ring-neutral-800"
          style={{ borderRadius: 14 }}
        >
          <IPadStatusBar />
          <div
            className="overflow-hidden bg-white"
            style={{ width: screenWidth, height: screenHeight }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowserFrame({
  screenWidth,
  screenHeight,
  title,
  children,
  darkClient,
}: {
  screenWidth: number;
  screenHeight: number;
  title?: string;
  children: React.ReactNode;
  darkClient?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border shadow-xl",
        darkClient ? "border-neutral-700 bg-neutral-900" : "border-neutral-300 bg-white dark:border-neutral-600",
      )}
      style={{ width: screenWidth }}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-3 py-2",
          darkClient ? "border-neutral-800 bg-neutral-800" : "border-neutral-200 bg-neutral-100",
        )}
      >
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div
          className={cn(
            "mx-auto min-w-0 flex-1 truncate rounded-md px-2 py-0.5 text-center text-[10px]",
            darkClient ? "bg-neutral-900 text-neutral-400" : "bg-white text-neutral-500",
          )}
        >
          {title ?? "Email preview"}
        </div>
      </div>
      <div style={{ width: screenWidth, height: screenHeight }}>{children}</div>
    </div>
  );
}
