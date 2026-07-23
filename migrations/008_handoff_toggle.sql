-- Migration 008: Live-chat handoff toggle on chatbots
-- /api/bot-config previously hard-coded `handoff: true`, so the widget always
-- showed the "Talk to a human" button no matter what the owner wanted. This
-- makes it a real, per-bot setting read by /api/bot-config and applied by
-- public/widget.js.
--
-- Default TRUE preserves the existing (always-on) behaviour for live bots.

ALTER TABLE replyee_chatbots
  ADD COLUMN IF NOT EXISTS handoff_enabled BOOLEAN NOT NULL DEFAULT TRUE;
