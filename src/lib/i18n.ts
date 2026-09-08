export type Locale = "pt-BR" | "en" | "es";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "pt-BR", label: "Português (BR)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export const translations: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    welcome: "Olá",
    greeting: "Bem-vindo ao Send Studio",
    body: "Obrigado por se juntar à nossa plataforma. Estamos felizes em ter você conosco.",
    cta: "Começar agora",
    footer: "Você recebeu este email porque se inscreveu em nossa lista.",
    unsubscribe: "Cancelar inscrição",
    subject_welcome: "Bem-vindo, {{ contact.name }}!",
  },
  en: {
    welcome: "Hello",
    greeting: "Welcome to Send Studio",
    body: "Thank you for joining our platform. We're excited to have you on board.",
    cta: "Get started",
    footer: "You're receiving this email because you signed up for our list.",
    unsubscribe: "Unsubscribe",
    subject_welcome: "Welcome, {{ contact.name }}!",
  },
  es: {
    welcome: "Hola",
    greeting: "Bienvenido a Send Studio",
    body: "Gracias por unirte a nuestra plataforma. Estamos emocionados de tenerte.",
    cta: "Comenzar",
    footer: "Recibiste este email porque te suscribiste a nuestra lista.",
    unsubscribe: "Cancelar suscripción",
    subject_welcome: "¡Bienvenido, {{ contact.name }}!",
  },
};

export function getTranslations(locale: string): Record<string, string> {
  return translations[locale as Locale] ?? translations.en;
}

export function normalizeLocale(locale?: string | null): Locale {
  if (locale === "pt-BR" || locale === "en" || locale === "es") return locale;
  return "en";
}

/** Example Liquid content block — copy into the editor */
export const EXAMPLE_CONTENT_BLOCK = `{% assign lang = contact.locale | default: "en" %}

{% case lang %}
  {% when "pt-BR" %}
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:600;color:#111">
      Olá, {{ contact.name }}! 👋
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444">
      Obrigado por se juntar à <strong>{{ contact.company }}</strong>.
      {{ t.body }}
    </p>
  {% when "es" %}
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:600;color:#111">
      ¡Hola, {{ contact.name }}! 👋
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444">
      Gracias por unirte a <strong>{{ contact.company }}</strong>.
      {{ t.body }}
    </p>
  {% else %}
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:600;color:#111">
      Hello, {{ contact.name }}! 👋
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#444">
      Thank you for joining <strong>{{ contact.company }}</strong>.
      {{ t.body }}
    </p>
{% endcase %}

{% if contact.company != blank %}
  <p style="margin:24px 0 0;font-size:12px;color:#888">
    {{ t.footer }}
  </p>
{% endif %}`;

export const LIQUID_SNIPPETS = [
  {
    label: "Nome do contato",
    code: "{{ contact.name }}",
  },
  {
    label: "Tradução (t.chave)",
    code: "{{ t.welcome }}",
  },
  {
    label: "Condicional por locale",
    code: `{% if contact.locale == "pt-BR" %}
  Texto em português
{% else %}
  English text
{% endif %}`,
  },
  {
    label: "Case por idioma",
    code: `{% case contact.locale %}
  {% when "pt-BR" %}Olá
  {% when "es" %}Hola
  {% else %}Hello
{% endcase %}`,
  },
];
