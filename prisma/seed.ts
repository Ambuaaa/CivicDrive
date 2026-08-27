/* Seed: demo accounts, RTOs, slots and applications in various states. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// 1x1 transparent PNG (valid image for doc previews)
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding…");

  // wipe in FK-safe order
  await db.notification.deleteMany();
  await db.statusHistory.deleteMany();
  await db.payment.deleteMany();
  await db.appointment.deleteMany();
  await db.document.deleteMany();
  await db.application.deleteMany();
  await db.slot.deleteMany();
  await db.rto.deleteMany();
  await db.user.deleteMany();

  /* users */
  const password = await bcrypt.hash("demo1234", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  const admin = await db.user.create({
    data: {
      name: "Officer Meena",
      email: "admin@civicdrive.in",
      phone: "9876500001",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const demo = await db.user.create({
    data: {
      name: "Rahul Sharma",
      email: "demo@civicdrive.in",
      phone: "9876500002",
      passwordHash: password,
      role: "CITIZEN",
    },
  });

  const priya = await db.user.create({
    data: {
      name: "Priya Verma",
      email: "priya@civicdrive.in",
      phone: "9876500003",
      passwordHash: password,
      role: "CITIZEN",
    },
  });

  /* RTOs */
  const rtos = await Promise.all(
    [
      { code: "DL-01", name: "Central Delhi RTO", city: "New Delhi", state: "Delhi", address: "IP Estate, New Delhi 110002" },
      { code: "DL-02", name: "West Delhi RTO", city: "New Delhi", state: "Delhi", address: "Janakpuri, New Delhi 110058" },
      { code: "DL-13", name: "South Delhi RTO", city: "New Delhi", state: "Delhi", address: "Saket, New Delhi 110017" },
    ].map((r) => db.rto.create({ data: r })),
  );
  const [rto1] = rtos;

  /* slots: next 10 days × 12 half-hour slots */
  const times = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
  const slotData: { rtoId: string; date: string; time: string }[] = [];
  for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const date = isoDate(d);
    for (const time of times) {
      for (const rto of rtos) {
        slotData.push({ rtoId: rto.id, date, time });
      }
    }
  }
  await db.slot.createMany({ data: slotData });
  console.log(`Created ${slotData.length} slots across ${rtos.length} RTOs.`);

  const firstSlotOf = async (rtoId: string, minDaysAhead = 2) => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + minDaysAhead);
    return db.slot.findFirst({
      where: { rtoId, date: { gte: isoDate(minDate) } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
  };

  const docs = () => ({
    create: ["ID_PROOF", "ADDRESS_PROOF", "PHOTO"].map((type) => ({
      type,
      fileName: `${type.toLowerCase()}-demo.png`,
      mimeType: "image/png",
      data: TINY_PNG,
      status: "PENDING",
    })),
  });

  /* ---- Application A (demo citizen): full journey → APPROVED ---- */
  const year = new Date().getFullYear();
  const appA = await db.application.create({
    data: {
      applicationNumber: `CD-${year}-100001`,
      userId: demo.id,
      type: "NEW_DL",
      status: "APPROVED",
      fullName: "Rahul Sharma",
      dob: "1999-06-15",
      gender: "Male",
      fatherName: "Suresh Sharma",
      bloodGroup: "O+",
      houseNo: "B-204",
      street: "MG Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110030",
      rtoId: rto1.id,
      documents: docs(),
    },
  });
  // attach real relations
  await db.document.updateMany({ where: { applicationId: appA.id }, data: { status: "VERIFIED" } });

  const slotA = await firstSlotOf(rto1.id, -2); // a past-ish slot
  if (slotA) {
    await db.appointment.create({ data: { applicationId: appA.id, slotId: slotA.id } });
  }

  await db.payment.create({
    data: {
      applicationId: appA.id,
      txnId: "TXN-DEMO100001",
      amount: 400,
      baseFee: 350,
      convenienceFee: 50,
      method: "upi",
      status: "SUCCESS",
    },
  });

  const licenceNumber = `01${year}48392017`;
  await db.application.update({
    where: { id: appA.id },
    data: {
      licenceNumber,
      history: {
        createMany: {
          data: [
            { status: "SUBMITTED", message: "Application submitted with all documents.", actor: "CITIZEN" },
            { status: "DOCS_VERIFIED", message: "Documents verified by reviewing officer.", actor: `ADMIN (${admin.name})` },
            { status: "FEE_PAID", message: "Payment successful. Transaction ID TXN-DEMO100001.", actor: "PAYMENT_GATEWAY" },
            { status: "APPOINTMENT_BOOKED", message: "Slot booked for the driving test.", actor: "CITIZEN" },
            { status: "APPROVED", message: `Driving test cleared. Licence ${licenceNumber} issued.`, actor: `ADMIN (${admin.name})` },
          ],
        },
      },
    },
  });

  await db.notification.createMany({
    data: [
      {
        userId: demo.id,
        title: "🎉 Licence approved!",
        body: `${appA.applicationNumber} is approved. Licence no. ${licenceNumber}. Your digital licence is ready to view.`,
        link: `/application/${appA.id}`,
      },
      {
        userId: demo.id,
        title: "Payment successful",
        body: `We received ₹400 for ${appA.applicationNumber}. Txn ID: TXN-DEMO100001.`,
        link: `/application/${appA.id}`,
        readAt: new Date(),
      },
    ],
  });

  /* ---- Application B (demo citizen): FEE_PAID → ready to book slot ---- */
  const appB = await db.application.create({
    data: {
      applicationNumber: `CD-${year}-100002`,
      userId: demo.id,
      type: "RENEWAL",
      status: "FEE_PAID",
      fullName: "Rahul Sharma",
      dob: "1999-06-15",
      gender: "Male",
      fatherName: "Suresh Sharma",
      houseNo: "B-204",
      street: "MG Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110030",
      rtoId: rtos[1].id,
      documents: docs(),
    },
  });
  await db.document.updateMany({ where: { applicationId: appB.id }, data: { status: "VERIFIED" } });
  await db.statusHistory.createMany({
    data: [
      { applicationId: appB.id, status: "SUBMITTED", message: "Renewal application submitted.", actor: "CITIZEN" },
      { applicationId: appB.id, status: "DOCS_VERIFIED", message: "Documents verified by reviewing officer.", actor: `ADMIN (${admin.name})` },
      { applicationId: appB.id, status: "FEE_PAID", message: "Payment successful. Txn ID TXN-DEMO200002.", actor: "PAYMENT_GATEWAY" },
    ],
  });
  await db.payment.create({
    data: {
      applicationId: appB.id,
      txnId: "TXN-DEMO200002",
      amount: 300,
      baseFee: 250,
      convenienceFee: 50,
      method: "card",
      status: "SUCCESS",
    },
  });

  /* ---- Application C (priya): SUBMITTED → waiting in admin queue ---- */
  const appC = await db.application.create({
    data: {
      applicationNumber: `CD-${year}-100003`,
      userId: priya.id,
      type: "NEW_DL",
      status: "SUBMITTED",
      fullName: "Priya Verma",
      dob: "2001-11-02",
      gender: "Female",
      fatherName: "Anil Verma",
      houseNo: "42",
      street: "Rohini Sector 9",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110085",
      rtoId: rto1.id,
      documents: docs(),
      history: {
        create: {
          status: "SUBMITTED",
          message: "Application submitted with all documents.",
          actor: "CITIZEN",
        },
      },
    },
  });

  await db.notification.create({
    data: {
      userId: priya.id,
      title: "Application submitted",
      body: `${appC.applicationNumber} was received. An RTO officer will verify your documents next.`,
      link: `/application/${appC.id}`,
    },
  });

  /* ---- Application D (priya): APPOINTMENT_BOOKED → admin can issue licence ---- */
  const appD = await db.application.create({
    data: {
      applicationNumber: `CD-${year}-100004`,
      userId: priya.id,
      type: "NEW_DL",
      status: "APPOINTMENT_BOOKED",
      fullName: "Priya Verma",
      dob: "2001-11-02",
      gender: "Female",
      fatherName: "Anil Verma",
      houseNo: "42",
      street: "Rohini Sector 9",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110085",
      rtoId: rtos[2].id,
      documents: docs(),
    },
  });
  await db.document.updateMany({ where: { applicationId: appD.id }, data: { status: "VERIFIED" } });
  const slotD = await firstSlotOf(rtos[2].id, 2);
  if (slotD) {
    await db.appointment.create({ data: { applicationId: appD.id, slotId: slotD.id } });
  }
  await db.payment.create({
    data: {
      applicationId: appD.id,
      txnId: "TXN-DEMO300004",
      amount: 400,
      baseFee: 350,
      convenienceFee: 50,
      method: "netbanking",
      status: "SUCCESS",
    },
  });
  await db.statusHistory.createMany({
    data: [
      { applicationId: appD.id, status: "SUBMITTED", message: "Application submitted.", actor: "CITIZEN" },
      { applicationId: appD.id, status: "DOCS_VERIFIED", message: "Documents verified.", actor: `ADMIN (${admin.name})` },
      { applicationId: appD.id, status: "FEE_PAID", message: "Payment successful.", actor: "PAYMENT_GATEWAY" },
      { applicationId: appD.id, status: "APPOINTMENT_BOOKED", message: "Slot booked for the driving test.", actor: "CITIZEN" },
    ],
  });

  console.log("Seed complete.");
  console.log("  Citizen login : demo@civicdrive.in / demo1234");
  console.log("  Admin login   : admin@civicdrive.in / admin1234");
  console.log(`  Applications  : CD-${year}-100001 (approved), CD-${year}-100002 (fee paid), CD-${year}-100003 (submitted), CD-${year}-100004 (booked)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

