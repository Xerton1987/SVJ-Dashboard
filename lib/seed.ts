import { PrismaClient, MemberRole, UnitType, OwnershipSource } from "@prisma/client";
import bcryptjs from "bcryptjs";
import Decimal from "decimal.js";

/**
 * Naplní databázi ukázkovými daty (jedno SVJ, budova, 2 vchody, 4 jednotky,
 * 3 uživatelé s členstvími a vlastnictvími). Operace jsou idempotentní —
 * opakované spuštění nevytvoří duplicity. Funkce vrací testovací účty.
 */
export async function runSeed(db: PrismaClient) {
  const svj = await db.svj.upsert({
    where: { ico: "12345678" },
    update: {},
    create: {
      ico: "12345678",
      dic: "CZ12345678",
      nazev: "Bytové společenství Parkova 42",
      sidlo: "Parkova 42, 110 00 Praha 1",
    },
  });

  const building = await db.building.upsert({
    where: { id: "seed-building-1" },
    update: {},
    create: {
      id: "seed-building-1",
      svjId: svj.id,
      adresa: "Parkova 42, Praha 1",
      popiscneCislo: "42",
      pocetJednotek: 4,
    },
  });

  const entrance1 = await db.entrance.upsert({
    where: { id: "seed-entrance-1" },
    update: {},
    create: { id: "seed-entrance-1", buildingId: building.id, cislo: "42a", popis: "Vchod A" },
  });

  const entrance2 = await db.entrance.upsert({
    where: { id: "seed-entrance-2" },
    update: {},
    create: { id: "seed-entrance-2", buildingId: building.id, cislo: "42b", popis: "Vchod B" },
  });

  const unit1 = await db.unit.upsert({
    where: { id: "seed-unit-1" },
    update: {},
    create: {
      id: "seed-unit-1",
      entranceId: entrance1.id,
      cisloJednotkyKn: "42a/1",
      plochaMq: new Decimal("68.50"),
      spoluvlPodilCitatel: 685,
      spoluvlPodilJmenovatel: 3000,
      typ: UnitType.BYT,
      pocetOsob: 2,
    },
  });

  const unit2 = await db.unit.upsert({
    where: { id: "seed-unit-2" },
    update: {},
    create: {
      id: "seed-unit-2",
      entranceId: entrance1.id,
      cisloJednotkyKn: "42a/2",
      plochaMq: new Decimal("72.00"),
      spoluvlPodilCitatel: 720,
      spoluvlPodilJmenovatel: 3000,
      typ: UnitType.BYT,
      pocetOsob: 3,
    },
  });

  const unit3 = await db.unit.upsert({
    where: { id: "seed-unit-3" },
    update: {},
    create: {
      id: "seed-unit-3",
      entranceId: entrance2.id,
      cisloJednotkyKn: "42b/1",
      plochaMq: new Decimal("55.25"),
      spoluvlPodilCitatel: 553,
      spoluvlPodilJmenovatel: 3000,
      typ: UnitType.BYT,
      pocetOsob: 1,
    },
  });

  const unit4 = await db.unit.upsert({
    where: { id: "seed-unit-4" },
    update: {},
    create: {
      id: "seed-unit-4",
      entranceId: entrance2.id,
      cisloJednotkyKn: "42b/2",
      plochaMq: new Decimal("42.00"),
      spoluvlPodilCitatel: 420,
      spoluvlPodilJmenovatel: 3000,
      typ: UnitType.BYT,
      pocetOsob: 2,
    },
  });

  const adminPassword = await bcryptjs.hash("admin123456", 12);
  const memberPassword = await bcryptjs.hash("member123456", 12);

  const admin = await db.user.upsert({
    where: { email: "predseda@parkova42.cz" },
    update: {},
    create: {
      email: "predseda@parkova42.cz",
      name: "Jana Nováková",
      jmeno: "Jana",
      prijmeni: "Nováková",
      telefon: "+420 777 111 111",
      password: adminPassword,
    },
  });

  const member1 = await db.user.upsert({
    where: { email: "vlastnik1@email.cz" },
    update: {},
    create: {
      email: "vlastnik1@email.cz",
      name: "Petr Svoboda",
      jmeno: "Petr",
      prijmeni: "Svoboda",
      telefon: "+420 777 222 222",
      password: memberPassword,
    },
  });

  const member2 = await db.user.upsert({
    where: { email: "vlastnik2@email.cz" },
    update: {},
    create: {
      email: "vlastnik2@email.cz",
      name: "Marie Horáková",
      jmeno: "Marie",
      prijmeni: "Horáková",
      telefon: "+420 777 333 333",
      password: memberPassword,
    },
  });

  await db.svj.update({ where: { id: svj.id }, data: { predsedaUserId: admin.id } });

  await db.membership.upsert({
    where: { userId_svjId_role: { userId: admin.id, svjId: svj.id, role: MemberRole.COMMITTEE_CHAIR } },
    update: {},
    create: { userId: admin.id, svjId: svj.id, role: MemberRole.COMMITTEE_CHAIR, grantedByUserId: admin.id },
  });

  await db.membership.upsert({
    where: { userId_svjId_role: { userId: member1.id, svjId: svj.id, role: MemberRole.MEMBER } },
    update: {},
    create: { userId: member1.id, svjId: svj.id, role: MemberRole.MEMBER, grantedByUserId: admin.id },
  });

  await db.membership.upsert({
    where: { userId_svjId_role: { userId: member2.id, svjId: svj.id, role: MemberRole.MEMBER } },
    update: {},
    create: { userId: member2.id, svjId: svj.id, role: MemberRole.MEMBER, grantedByUserId: admin.id },
  });

  await db.unitOwnership.createMany({
    data: [
      { unitId: unit1.id, userId: admin.id, podilCitatel: 685, podilJmenovatel: 3000, source: OwnershipSource.MANUAL },
      { unitId: unit2.id, userId: member1.id, podilCitatel: 720, podilJmenovatel: 3000, source: OwnershipSource.MANUAL },
      { unitId: unit3.id, userId: member2.id, podilCitatel: 553, podilJmenovatel: 3000, source: OwnershipSource.MANUAL },
      { unitId: unit4.id, userId: member2.id, podilCitatel: 420, podilJmenovatel: 3000, source: OwnershipSource.MANUAL },
    ],
    skipDuplicates: true,
  });

  await db.auditLog.createMany({
    data: [
      { svjId: svj.id, userId: admin.id, action: "CREATE", entityType: "Svj", entityId: svj.id, payload: { nazev: svj.nazev } },
      { svjId: svj.id, userId: admin.id, action: "GRANT_ROLE", entityType: "Membership", payload: { role: "MEMBER", targetUserId: member1.id } },
      { svjId: svj.id, userId: admin.id, action: "GRANT_ROLE", entityType: "Membership", payload: { role: "MEMBER", targetUserId: member2.id } },
    ],
  });

  return {
    svj: svj.nazev,
    units: [unit1, unit2, unit3, unit4].map((u) => u.cisloJednotkyKn),
    accounts: [
      { email: "predseda@parkova42.cz", password: "admin123456", role: "Předseda výboru" },
      { email: "vlastnik1@email.cz", password: "member123456", role: "Vlastník" },
      { email: "vlastnik2@email.cz", password: "member123456", role: "Vlastník" },
    ],
  };
}
