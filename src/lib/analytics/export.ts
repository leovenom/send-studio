import type { AnalyticsData, AnalyticsRates } from "./types";

function csvEscape(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values: (string | number | null | undefined)[]): string {
  return values.map(csvEscape).join(",");
}

export function analyticsToCsv(data: AnalyticsData): string {
  const lines: string[] = [];
  const { rates, campaignName, channel } = data;
  const title = campaignName ?? "All campaigns";

  lines.push(row(["Send Studio — Analytics Export"]));
  lines.push(row(["Campaign", title]));
  lines.push(row(["Channel", channel]));
  lines.push(row(["Generated", new Date().toISOString()]));
  lines.push("");

  lines.push(row(["Metric", "Value"]));
  appendSummaryRows(lines, rates, channel);
  lines.push("");

  lines.push(
    row([
      "Event",
      "Contact name",
      "Contact email",
      "Subject",
      "Campaign",
      "Date",
      "Resend ID",
    ]),
  );

  for (const event of data.allEvents) {
    lines.push(
      row([
        event.type,
        event.contactName,
        event.contactEmail,
        event.emailSubject,
        event.campaignName,
        event.createdAt,
        event.resendId,
      ]),
    );
  }

  return lines.join("\n");
}

function appendSummaryRows(
  lines: string[],
  rates: AnalyticsRates,
  channel: AnalyticsData["channel"],
) {
  if (channel === "email" || channel === "all") {
    lines.push(row(["Sent", rates.sent]));
    lines.push(row(["Delivered", rates.delivered]));
    lines.push(row(["Opened (total)", rates.opened]));
    lines.push(row(["Opened (human)", rates.openedHuman]));
    lines.push(row(["Opened (bot)", rates.openedBot]));
    lines.push(row(["Honeypot probes", rates.botProbes]));
    lines.push(row(["Clicked", rates.clicked]));
    lines.push(row(["Bounced", rates.bounced]));
    lines.push(
      row([
        "Delivery rate",
        rates.sent > 0 ? `${Math.round((rates.delivered / rates.sent) * 100)}%` : "0%",
      ]),
    );
    lines.push(
      row([
        "Human open rate",
        rates.opened > 0
          ? `${Math.round((rates.openedHuman / rates.opened) * 100)}%`
          : "0%",
      ]),
    );
    lines.push(
      row([
        "Click rate (human opens)",
        rates.openedHuman > 0
          ? `${Math.round((rates.clicked / rates.openedHuman) * 100)}%`
          : "0%",
      ]),
    );
  } else {
    lines.push(row(["Messages sent", rates.sent]));
    lines.push(row(["Failed", rates.bounced]));
    lines.push(row(["Demo / skipped", rates.openedBot + rates.botProbes]));
  }
}

export function exportFilename(data: AnalyticsData): string {
  const slug = (data.campaignName ?? "all-campaigns")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `send-studio-analytics-${slug}-${date}.csv`;
}
