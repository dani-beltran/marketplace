var Prisma = require("../src/lib/prisma-client");
var Joda = require("@js-joda/core");

console.info("Seeding DB...");
console.info("URL: ", process.env.DATABASE_URL);
runSeeding()
  .then(() => {
    console.info("COMPLETED");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

async function runSeeding() {
  const db = new Prisma.PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    // Reset DB
    await db.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
    // Insert users and their wallets
    const [clientId, contractorId, otherClientId] = (
      await createMany(db, db.wallet, [
        // Client
        {
          balance: "1000.00",
          user: {
            create: {
              name: "Pepe",
              email: "pepe@dummy-mail.com",
              image:
                "https://ih1.redbubble.net/image.3287754550.6742/st,small,507x507-pad,600x600,f8f8f8.u2.jpg",
            },
          },
        },
        // Contractor
        {
          balance: "0.00",
          user: {
            create: {
              name: "Juan",
              email: "juan@dummy-mail.com",
            },
          },
        },
        // Another client
        {
          balance: "0.00",
          user: {
            create: {
              name: "Manolo",
              email: "manolo@dummy-mail.com",
            },
          },
        },
      ])
    ).map((w) => w.userId);

    // Insert jobs with no contracts
    const nJobs = 60;
    const inputJobs = new Array(nJobs).fill(0).map((_, i) => ({
      name: `Issue #${i}`,
      description:
        "Lorem impsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      user: { connect: { id: clientId } },
    }));
    await createMany(db, db.job, inputJobs);
    // Insert contracts
    const [contract, anotherContract] = await createMany(db, db.contract, [
      {
        client: { connect: { id: clientId } },
        contractor: { connect: { id: contractorId } },
        name: `The Contract`,
        terms: "none",
        startDate: new Date(),
        endDate: new Date(Joda.LocalDate.now().plusDays(30).toString()),
        totalCost: Math.round(Math.random() * 1000).toString(),
        job: {
          create: {
            name: `The Issue`,
            description: "none",
            user: { connect: { id: clientId } },
          },
        },
      },
      {
        client: { connect: { id: otherClientId } },
        contractor: { connect: { id: contractorId } },
        name: `The Another Contract`,
        terms: "none",
        startDate: new Date(),
        endDate: new Date(Joda.LocalDate.now().plusDays(30).toString()),
        totalCost: Math.round(Math.random() * 1000).toString(),
        job: {
          create: {
            name: `The Issue`,
            description: "none",
            user: { connect: { id: otherClientId } },
          },
        },
      },
    ]);
    // Insert invoices
    const nInvoices = 20;
    const inputInvoices = new Array(nInvoices).fill(0).map((_, i) => ({
      number: `INV-${i}`,
      date: new Date(),
      status: i % 3 === 0 ? "paid" : "pending",
      paidAt: i % 3 === 0 ? new Date() : null,
      dueDate: new Date(Joda.LocalDate.now().plusDays(30).toString()),
      subtotal: Math.round(Math.random() * 1000).toString(),
      contract: { connect: { id: i % 2 ? contract.id : anotherContract.id } },
    }));
    await createMany(db, db.invoice, inputInvoices);

    db.$disconnect();
  } catch (e) {
    db.$disconnect();
    throw e;
  }
}

/**
 * Creates many records in a single transaction.
 * This is a workaround for the lack of batch operations in Prisma that returns
 * the created records.
 */
function createMany(client, model, records) {
  return client.$transaction(
    records.map((record) => model.create({ data: record }))
  );
}
