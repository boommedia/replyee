-- Migration 005: Restaurant info on chatbots
-- Stores address/phone so the widget can show a Get Directions button
-- and the bot system prompt can include contact info without a RAG lookup.

ALTER TABLE replyee_chatbots
  ADD COLUMN IF NOT EXISTS restaurant_address TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_phone   TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_hours   TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_website TEXT;
