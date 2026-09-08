import type { KeyboardEvent } from "react";

export function makeTabIds(prefix: string, id: string) {
  return {
    tab: `${prefix}-tab-${id}`,
    panel: `${prefix}-panel-${id}`,
  };
}

export function handleTabArrowKeys<T extends string>(
  event: KeyboardEvent<HTMLElement>,
  tabs: readonly T[],
  active: T,
  onChange: (next: T) => void,
  prefix: string,
) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  event.preventDefault();
  const index = tabs.indexOf(active);
  if (index < 0) return;

  const delta = event.key === "ArrowRight" ? 1 : -1;
  const next = tabs[(index + delta + tabs.length) % tabs.length];
  onChange(next);

  requestAnimationFrame(() => {
    document.getElementById(makeTabIds(prefix, next).tab)?.focus();
  });
}

export function getTabProps(
  prefix: string,
  id: string,
  active: boolean,
) {
  const ids = makeTabIds(prefix, id);
  return {
    id: ids.tab,
    role: "tab" as const,
    "aria-selected": active,
    "aria-controls": ids.panel,
    tabIndex: active ? 0 : -1,
  };
}

export function getTabPanelProps(prefix: string, id: string, labelledByTabId: string) {
  return {
    id: makeTabIds(prefix, id).panel,
    role: "tabpanel" as const,
    "aria-labelledby": labelledByTabId,
  };
}
