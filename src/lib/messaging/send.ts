interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  waLink?: string;
  error?: string;
  demo?: boolean;
}

export async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<WhatsAppResult> {
  const normalized = phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { success: true, demo: true, waLink };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalized,
          type: "text",
          text: { preview_url: true, body: text.slice(0, 4096) },
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message ?? "WhatsApp API error",
        waLink,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      waLink,
    };
  }
}

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
  demo?: boolean;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML",
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return { success: true, demo: true };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096),
          parse_mode: parseMode,
          disable_web_page_preview: false,
        }),
      },
    );

    const data = await res.json();

    if (!data.ok) {
      const plain = text.replace(/<[^>]+>/g, "");
      const retry = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: plain.slice(0, 4096),
            disable_web_page_preview: false,
          }),
        },
      );
      const retryData = await retry.json();
      if (retryData.ok) {
        return { success: true, messageId: retryData.result?.message_id };
      }
      return { success: false, error: data.description ?? "Telegram API error" };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Envia foto no Telegram quando template tem imagem */
export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || photoUrl.startsWith("data:")) {
    return { success: true, demo: true };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption?.slice(0, 1024),
          parse_mode: "HTML",
        }),
      },
    );
    const data = await res.json();
    if (!data.ok) return { success: false, error: data.description };
    return { success: true, messageId: data.result?.message_id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}
