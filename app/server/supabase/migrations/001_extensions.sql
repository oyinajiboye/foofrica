-- ============================================================
-- Migration 001: Extensions
-- Enable required PostgreSQL extensions
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search with pg_trgm (fuzzy matching)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Unaccent for search normalization
CREATE EXTENSION IF NOT EXISTS "unaccent";
