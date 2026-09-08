"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEVICE_WIDTHS,
  type DevicePreview,
} from "@/lib/email-shell";
import { openEmailPreviewPopup } from "@/lib/email-preview-popup";
import { getTabProps, handleTabArrowKeys, makeTabIds } from "@/components/ui/tab-list";
import { useT } from "@/components/locale/locale-provider";
import { useTheme } from "@/components/theme/theme-provider";
import { accentToneStyles, type AccentTone } from "@/lib/accent-styles";
import {
  BrowserFrame,
  BROWSER_CHROME_HEIGHT,
  getIPadOuterSize,
  getIPhoneOuterSize,
  IPadFrame,
  IPhoneFrame,
} from "./device-frames";
import { ExternalLink, Laptop, Loader2, Moon, Smartphone, Sun, Tablet } from "lucide-react";

const PREVIEW_DARK_CLIENT_KEY = "send-studio-preview-dark-client";

const DEVICE_TONES: Record<DevicePreview, AccentTone> = {
  mobile: "blue",
  tablet: "cyan",
  laptop: "violet",
};

function readPreviewDarkClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREVIEW_DARK_CLIENT_KEY) === "true";
  } catch {
    return false;
  }
}

const DEVICE_ICONS: Record<DevicePreview, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
};

const PREVIEW_HEIGHT = 520;
const PREVIEW_HEIGHT_FULLSCREEN_MIN = 640;

interface ResponsiveEmailPreviewProps {
  html: string;
  subject?: string;
  preheader?: string;
  subjectLabel?: string;
  preheaderLabel?: string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  localeSelector?: React.ReactNode;
  embedded?: boolean;
  device?: DevicePreview;
  onDeviceChange?: (device: DevicePreview) => void;
  hideDeviceTabs?: boolean;
  /** Estado inicial ao abrir popup ou editor */
  initialDevice?: DevicePreview;
  /** Página /preview/email — iframe mais alto */
  fullscreen?: boolean;
  initialDarkClient?: boolean;
}

const DEVICE_TAB_ORDER: DevicePreview[] = ["mobile", "tablet", "laptop"];

export const PREVIEW_DEVICE_TAB_PREFIX = "preview-device";

export function DeviceTabs({
  device,
  onChange,
  labels,
  ariaLabel,
  tabPrefix = PREVIEW_DEVICE_TAB_PREFIX,
}: {
  device: DevicePreview;
  onChange: (d: DevicePreview) => void;
  labels: Record<DevicePreview, { label: string; width: number }>;
  ariaLabel: string;
  tabPrefix?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid grid-cols-3 gap-1 rounded-xl border border-[#8ec5ff]/20 bg-[#8ec5ff]/5 p-1"
      onKeyDown={(e) =>
        handleTabArrowKeys(e, DEVICE_TAB_ORDER, device, onChange, tabPrefix)
      }
    >
      {DEVICE_TAB_ORDER.map((d) => {
        const Icon = DEVICE_ICONS[d];
        const active = device === d;
        const style = accentToneStyles[DEVICE_TONES[d]];

        return (
          <button
            key={d}
            type="button"
            {...getTabProps(tabPrefix, d, active)}
            aria-label={`${labels[d].label} (${labels[d].width}px)`}
            onClick={() => onChange(d)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 transition-all focus-ring",
              active ? "tab-pill-active shadow-sm" : "tab-pill-idle hover:bg-[#8ec5ff]/10",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                active ? "bg-white/20" : style.icon,
              )}
            >
              <Icon className="h-3 w-3" aria-hidden />
            </span>
            <span className="truncate text-[11px] font-medium">{labels[d].label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScaledDeviceFrame({
  outerWidth,
  outerHeight,
  children,
}: {
  outerWidth: number;
  outerHeight: number;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      setScale(available > 0 ? Math.min(1, available / outerWidth) : 1);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [outerWidth]);

  const scaledHeight = outerHeight * scale;

  return (
    <div ref={outerRef} className="w-full max-w-full" style={{ height: scaledHeight }}>
      <div
        className="origin-top-left transition-transform duration-300"
        style={{
          width: outerWidth,
          height: outerHeight,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ResponsiveEmailPreview({
  html,
  subject,
  preheader,
  subjectLabel = "Assunto",
  preheaderLabel = "Preheader",
  loading,
  emptyMessage = "Nenhum conteúdo para visualizar",
  className,
  localeSelector,
  embedded = false,
  device: deviceProp,
  onDeviceChange,
  hideDeviceTabs = false,
  initialDevice,
  fullscreen = false,
  initialDarkClient,
}: ResponsiveEmailPreviewProps) {
  const t = useT();
  const { resolvedTheme } = useTheme();
  const [internalDevice, setInternalDevice] = useState<DevicePreview>(
    () => deviceProp ?? initialDevice ?? "mobile",
  );
  const [simulateDarkClient, setSimulateDarkClient] = useState(
    () => initialDarkClient ?? readPreviewDarkClient(),
  );
  const [previewHeight, setPreviewHeight] = useState(
    fullscreen ? PREVIEW_HEIGHT_FULLSCREEN_MIN : PREVIEW_HEIGHT,
  );

  const device = deviceProp ?? internalDevice;
  const setDevice = onDeviceChange ?? setInternalDevice;

  useEffect(() => {
    if (!fullscreen) return;
    const update = () => {
      setPreviewHeight(Math.max(PREVIEW_HEIGHT_FULLSCREEN_MIN, window.innerHeight - 280));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [fullscreen]);

  const deviceLabels = {
    mobile: { label: t("preview.deviceMobile"), width: DEVICE_WIDTHS.mobile },
    tablet: { label: t("preview.deviceTablet"), width: DEVICE_WIDTHS.tablet },
    laptop: { label: t("preview.deviceDesktop"), width: DEVICE_WIDTHS.laptop },
  } satisfies Record<DevicePreview, { label: string; width: number }>;

  const deviceWidth = deviceLabels[device].width;
  const inboxDark = resolvedTheme === "dark" || simulateDarkClient;

  function toggleDarkClient() {
    setSimulateDarkClient((prev) => {
      const next = !prev;
      localStorage.setItem(PREVIEW_DARK_CLIENT_KEY, String(next));
      return next;
    });
  }

  function handleOpenInNewWindow() {
    if (!html) return;
    const opened = openEmailPreviewPopup({
      html,
      subject,
      preheader,
      device,
      darkClient: simulateDarkClient,
      subjectLabel,
      preheaderLabel,
    });
    if (!opened) {
      window.alert(t("preview.popupBlocked"));
    }
  }

  function renderIframeContent() {
    if (loading) {
      return (
        <div
          className={cn(
            "flex h-full items-center justify-center gap-2 text-xs",
            simulateDarkClient ? "text-neutral-400" : "text-muted",
          )}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("preview.rendering")}
        </div>
      );
    }

    if (!html) {
      return (
        <div
          className={cn(
            "flex h-full items-center justify-center text-xs",
            simulateDarkClient ? "text-neutral-400" : "text-muted",
          )}
        >
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className={cn("h-full w-full", simulateDarkClient && "invert hue-rotate-180")}>
        <iframe
          srcDoc={html}
          title={`Email preview — ${device}`}
          className="border-0"
          style={{
            width: deviceWidth,
            height: previewHeight,
            display: "block",
          }}
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  function renderDeviceFrame() {
    const content = renderIframeContent();

    if (device === "mobile") {
      const { outerWidth, outerHeight } = getIPhoneOuterSize(deviceWidth, previewHeight);
      return (
        <ScaledDeviceFrame outerWidth={outerWidth} outerHeight={outerHeight}>
          <IPhoneFrame screenWidth={deviceWidth} screenHeight={previewHeight}>
            {content}
          </IPhoneFrame>
        </ScaledDeviceFrame>
      );
    }

    if (device === "tablet") {
      const { outerWidth, outerHeight } = getIPadOuterSize(deviceWidth, previewHeight);
      return (
        <ScaledDeviceFrame outerWidth={outerWidth} outerHeight={outerHeight}>
          <IPadFrame screenWidth={deviceWidth} screenHeight={previewHeight}>
            {content}
          </IPadFrame>
        </ScaledDeviceFrame>
      );
    }

    const outerHeight = previewHeight + BROWSER_CHROME_HEIGHT;
    return (
      <ScaledDeviceFrame outerWidth={deviceWidth} outerHeight={outerHeight}>
        <BrowserFrame
          screenWidth={deviceWidth}
          screenHeight={previewHeight}
          title={subject || "Email preview"}
          darkClient={simulateDarkClient}
        >
          {content}
        </BrowserFrame>
      </ScaledDeviceFrame>
    );
  }

  const showDeviceTabs = !embedded || (embedded && !hideDeviceTabs);

  const previewCard = (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm",
        inboxDark ? "border-neutral-700 bg-neutral-950" : "border-[#8ec5ff]/15 bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5",
          inboxDark
            ? "border-neutral-800 bg-neutral-900/80"
            : "border-[#8ec5ff]/15 bg-gradient-to-r from-[#8ec5ff]/10 to-[#a78bfa]/8",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            inboxDark ? "bg-white/10 text-neutral-100" : accentToneStyles[DEVICE_TONES[device]].icon,
          )}
        >
          {device === "mobile" && <Smartphone className="h-3.5 w-3.5" aria-hidden />}
          {device === "tablet" && <Tablet className="h-3.5 w-3.5" aria-hidden />}
          {device === "laptop" && <Laptop className="h-3.5 w-3.5" aria-hidden />}
        </span>
        <span
          className={cn(
            "truncate text-xs font-medium",
            inboxDark ? "text-neutral-100" : "text-foreground",
          )}
        >
          {deviceLabels[device].label}
        </span>
        <span
          className={cn(
            "ml-auto font-mono text-[10px]",
            inboxDark ? "text-neutral-400" : "text-muted",
          )}
        >
          {deviceWidth}px
        </span>
      </div>

      {(subject || preheader) && (
        <div
          className={cn(
            "border-b px-4 py-2.5",
            inboxDark ? "border-neutral-800 bg-neutral-900/50" : "border-border bg-accent/30",
          )}
        >
          {subject && (
            <div className="mb-1">
              <p
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  inboxDark ? "text-neutral-400" : "text-muted",
                )}
              >
                {subjectLabel}
              </p>
              <p
                className={cn(
                  "truncate text-sm font-semibold",
                  inboxDark ? "text-neutral-50" : "text-foreground",
                )}
              >
                {subject}
              </p>
            </div>
          )}
          {preheader && (
            <div>
              <p
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  inboxDark ? "text-neutral-400" : "text-muted",
                )}
              >
                {preheaderLabel}
              </p>
              <p
                className={cn(
                  "line-clamp-2 text-xs",
                  inboxDark ? "text-neutral-400" : "text-muted-foreground",
                )}
              >
                {preheader}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex justify-center overflow-x-hidden",
          device === "mobile" || device === "tablet" ? "p-2 sm:p-3" : "p-3 sm:p-4",
          inboxDark ? "bg-neutral-950" : "bg-neutral-200/80 dark:bg-neutral-900",
        )}
      >
        {renderDeviceFrame()}
      </div>
    </div>
  );

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {!embedded && (
        <div className="space-y-2">
          <p className="label-caps !mb-0">{t("preview.responsiveTitle")}</p>
          {localeSelector && <div className="min-w-0">{localeSelector}</div>}
          <DeviceTabs
            device={device}
            onChange={setDevice}
            labels={deviceLabels}
            ariaLabel={t("preview.responsiveTitle")}
          />
        </div>
      )}

      {embedded && !hideDeviceTabs && (
        <div className="space-y-1.5">
          <p className="label-caps !mb-0">{t("preview.device")}</p>
          <DeviceTabs
            device={device}
            onChange={setDevice}
            labels={deviceLabels}
            ariaLabel={t("preview.device")}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={toggleDarkClient}
          aria-pressed={simulateDarkClient}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-all focus-ring",
            simulateDarkClient
              ? "border-[#8ec5ff]/35 bg-gradient-to-r from-[#8ec5ff]/10 to-[#a78bfa]/10 text-foreground"
              : "border-[#8ec5ff]/20 bg-card text-muted hover:border-[#8ec5ff]/30 hover:text-foreground",
          )}
        >
          {simulateDarkClient ? (
            <Moon className="h-3.5 w-3.5 shrink-0 text-[#8ec5ff]" />
          ) : (
            <Sun className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-medium">{t("preview.simulateDarkClient")}</span>
        </button>

        {!fullscreen && html && !loading && (
          <button
            type="button"
            onClick={handleOpenInNewWindow}
            className="btn-accent-secondary flex flex-1 px-3 py-2.5 text-xs focus-ring"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span>{t("preview.openInNewWindow")}</span>
          </button>
        )}
      </div>

      {!fullscreen && html && !loading && (
        <p className="text-[10px] text-muted-foreground">{t("preview.openInNewWindowHint")}</p>
      )}

      {showDeviceTabs ? (
        <div
          id={makeTabIds(PREVIEW_DEVICE_TAB_PREFIX, device).panel}
          role="tabpanel"
          aria-labelledby={makeTabIds(PREVIEW_DEVICE_TAB_PREFIX, device).tab}
        >
          {previewCard}
        </div>
      ) : (
        previewCard
      )}

      {!embedded && !fullscreen && (
        <p className="text-center text-[10px] text-muted-foreground">
          {t("preview.clientsFooter")}
        </p>
      )}
    </div>
  );
}
