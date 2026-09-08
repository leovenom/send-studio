import { revalidateTag, unstable_cache } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, contacts, templates } from "@/lib/db/schema";
import {
  formatCampaignSenderSummary,
  getDefaultSenders,
  parseCampaignSender,
} from "@/lib/messaging/campaign-sender";

export const LIST_CACHE_TAGS = {
  contacts: "list-contacts",
  templates: "list-templates",
  campaigns: "list-campaigns",
  bootstrap: "campaigns-bootstrap",
} as const;

export type TemplateListRow = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  blockCount: number;
};

export type CampaignListRow = {
  id: string;
  name: string;
  channel: string;
  status: string;
  archivedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  sender: string | null;
  templateName: string;
  templateSubject: string;
  senderSummary: string | null;
};

async function queryContacts() {
  return db.select().from(contacts).orderBy(contacts.createdAt);
}

async function queryTemplates(includeArchived: boolean) {
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      subject: templates.subject,
      preheader: templates.preheader,
      status: templates.status,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
      blockCount: sql<number>`coalesce(json_array_length(${templates.blocks}), 0)`.mapWith(Number),
    })
    .from(templates)
    .orderBy(desc(templates.updatedAt));

  return includeArchived ? rows : rows.filter((t) => t.status !== "archived");
}

async function queryCampaigns(includeArchived: boolean) {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      channel: campaigns.channel,
      status: campaigns.status,
      archivedAt: campaigns.archivedAt,
      sentAt: campaigns.sentAt,
      createdAt: campaigns.createdAt,
      sender: campaigns.sender,
      templateName: templates.name,
      templateSubject: templates.subject,
    })
    .from(campaigns)
    .innerJoin(templates, eq(campaigns.templateId, templates.id))
    .orderBy(campaigns.createdAt);

  const filtered = includeArchived ? rows : rows.filter((c) => !c.archivedAt);
  return filtered.map((c) => ({
    ...c,
    senderSummary: formatCampaignSenderSummary(parseCampaignSender(c.sender)),
  }));
}

export const getContactsList = unstable_cache(queryContacts, ["contacts-list"], {
  revalidate: 30,
  tags: [LIST_CACHE_TAGS.contacts, LIST_CACHE_TAGS.bootstrap],
});

export const getTemplatesList = unstable_cache(
  () => queryTemplates(true),
  ["templates-list-all"],
  {
    revalidate: 30,
    tags: [LIST_CACHE_TAGS.templates, LIST_CACHE_TAGS.bootstrap],
  },
);

export const getActiveTemplatesList = unstable_cache(
  () => queryTemplates(false),
  ["templates-list-active"],
  {
    revalidate: 30,
    tags: [LIST_CACHE_TAGS.templates, LIST_CACHE_TAGS.bootstrap],
  },
);

export const getCampaignsList = unstable_cache(
  () => queryCampaigns(true),
  ["campaigns-list-all"],
  {
    revalidate: 30,
    tags: [LIST_CACHE_TAGS.campaigns, LIST_CACHE_TAGS.bootstrap],
  },
);

export type CampaignsBootstrapData = {
  campaigns: CampaignListRow[];
  templates: TemplateListRow[];
  contacts: Awaited<ReturnType<typeof queryContacts>>;
  senderDefaults: ReturnType<typeof getDefaultSenders>;
};

async function queryCampaignsBootstrap(): Promise<CampaignsBootstrapData> {
  const [campaignRows, templateRows, contactRows] = await Promise.all([
    queryCampaigns(true),
    queryTemplates(false),
    queryContacts(),
  ]);

  return {
    campaigns: campaignRows,
    templates: templateRows,
    contacts: contactRows,
    senderDefaults: getDefaultSenders(),
  };
}

export const getCampaignsBootstrap = unstable_cache(
  queryCampaignsBootstrap,
  ["campaigns-bootstrap"],
  {
    revalidate: 30,
    tags: [
      LIST_CACHE_TAGS.bootstrap,
      LIST_CACHE_TAGS.contacts,
      LIST_CACHE_TAGS.templates,
      LIST_CACHE_TAGS.campaigns,
    ],
  },
);

export function invalidateListCache(...tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
}
