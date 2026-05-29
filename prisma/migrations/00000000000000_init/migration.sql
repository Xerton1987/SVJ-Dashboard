-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'TENANT', 'COMMITTEE_MEMBER', 'COMMITTEE_CHAIR', 'EXTERNAL_MANAGER', 'AUDITOR', 'GUEST');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('BYT', 'NEBYT', 'GARAZ', 'SKLEP', 'SPOL_PROSTOR');

-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('CS', 'EN', 'UK', 'DE');

-- CreateEnum
CREATE TYPE "OwnershipSource" AS ENUM ('MANUAL', 'KN_IMPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "telefon" TEXT,
    "jmeno" TEXT,
    "prijmeni" TEXT,
    "icOsoby" TEXT,
    "bankidSubjectId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" "PreferredLanguage" NOT NULL DEFAULT 'CS',
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationPush" BOOLEAN NOT NULL DEFAULT false,
    "notificationSms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Svj" (
    "id" TEXT NOT NULL,
    "ico" TEXT NOT NULL,
    "dic" TEXT,
    "nazev" TEXT NOT NULL,
    "sidlo" TEXT NOT NULL,
    "datovkaSchrankaId" TEXT,
    "stanovyDocId" TEXT,
    "predsedaUserId" TEXT,
    "bankAccountIban" TEXT,
    "bankAccountPrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Svj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "svjId" TEXT NOT NULL,
    "adresa" TEXT NOT NULL,
    "popiscneCislo" TEXT,
    "parcelaKn" TEXT,
    "pocetJednotek" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrance" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "cislo" TEXT NOT NULL,
    "popis" TEXT,

    CONSTRAINT "Entrance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "entranceId" TEXT NOT NULL,
    "cisloJednotkyKn" TEXT NOT NULL,
    "plochaMq" DECIMAL(15,2) NOT NULL,
    "spoluvlPodilCitatel" INTEGER NOT NULL,
    "spoluvlPodilJmenovatel" INTEGER NOT NULL,
    "typ" "UnitType" NOT NULL DEFAULT 'BYT',
    "pocetOsob" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOwnership" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podilCitatel" INTEGER NOT NULL,
    "podilJmenovatel" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "source" "OwnershipSource" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "UnitOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "svjId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "grantedByUserId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "notifyOutagesOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "svjId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Svj_ico_key" ON "Svj"("ico");

-- CreateIndex
CREATE INDEX "Svj_ico_idx" ON "Svj"("ico");

-- CreateIndex
CREATE INDEX "Building_svjId_idx" ON "Building"("svjId");

-- CreateIndex
CREATE INDEX "Entrance_buildingId_idx" ON "Entrance"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_cisloJednotkyKn_idx" ON "Unit"("cisloJednotkyKn");

-- CreateIndex
CREATE INDEX "Unit_entranceId_idx" ON "Unit"("entranceId");

-- CreateIndex
CREATE INDEX "UnitOwnership_unitId_idx" ON "UnitOwnership"("unitId");

-- CreateIndex
CREATE INDEX "UnitOwnership_userId_idx" ON "UnitOwnership"("userId");

-- CreateIndex
CREATE INDEX "UnitOwnership_unitId_userId_idx" ON "UnitOwnership"("unitId", "userId");

-- CreateIndex
CREATE INDEX "Membership_svjId_idx" ON "Membership"("svjId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_svjId_role_key" ON "Membership"("userId", "svjId", "role");

-- CreateIndex
CREATE INDEX "Tenant_unitId_idx" ON "Tenant"("unitId");

-- CreateIndex
CREATE INDEX "AuditLog_svjId_createdAt_idx" ON "AuditLog"("svjId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_svjId_entityType_entityId_idx" ON "AuditLog"("svjId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_svjId_fkey" FOREIGN KEY ("svjId") REFERENCES "Svj"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrance" ADD CONSTRAINT "Entrance_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "Entrance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOwnership" ADD CONSTRAINT "UnitOwnership_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOwnership" ADD CONSTRAINT "UnitOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_svjId_fkey" FOREIGN KEY ("svjId") REFERENCES "Svj"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_svjId_fkey" FOREIGN KEY ("svjId") REFERENCES "Svj"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

