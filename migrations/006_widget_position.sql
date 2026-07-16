-- Migration 006: Widget position on chatbots
-- Lets each bot owner choose which corner the chat bubble/window anchor to.
-- Values: 'bottom-right' (default) or 'bottom-left'. Read by /api/bot-config
-- and applied by public/widget.js.

ALTER TABLE replyee_chatbots
  ADD COLUMN IF NOT EXISTS widget_position TEXT NOT NULL DEFAULT 'bottom-right';
