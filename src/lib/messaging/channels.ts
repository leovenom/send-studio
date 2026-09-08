export type MessageChannel = "email" | "whatsapp" | "telegram";

export const CHANNELS: {
  id: MessageChannel;
  label: string;
  description: string;
  contactField: "email" | "phone" | "telegramChatId";
}[] = [
  { id: "email", label: "Email", description: "Via Resend API", contactField: "email" },
  { id: "whatsapp", label: "WhatsApp", description: "WhatsApp Cloud API", contactField: "phone" },
  { id: "telegram", label: "Telegram", description: "Bot API", contactField: "telegramChatId" },
];

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function whatsAppLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}
