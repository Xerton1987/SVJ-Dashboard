-- Partial unique index: one active ownership per (unitId, userId)
-- An active ownership is one where validTo IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS "UnitOwnership_unitId_userId_active_key"
  ON "UnitOwnership" ("unitId", "userId")
  WHERE "validTo" IS NULL;
