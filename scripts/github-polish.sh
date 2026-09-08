#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPO:-leovenom/send-studio}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in first: gh auth login"
  exit 1
fi

gh repo edit "$REPO" \
  --description "Multichannel CRM on Resend — block editor, Liquid i18n, campaigns & webhook analytics. Next.js + Turso." \
  --homepage "https://send-studio.vercel.app" \
  --add-topic nextjs \
  --add-topic typescript \
  --add-topic resend \
  --add-topic crm \
  --add-topic vercel \
  --add-topic turso \
  --add-topic email-marketing \
  --add-topic portfolio

echo ""
echo "Done: description, homepage, topics."
echo ""
echo "Pin the repo on your profile (manual, ~30s):"
echo "  https://github.com/leovenom?tab=repositories"
echo "  → Customize your pins → select send-studio"
