var Prisma = require("../src/lib/prisma-client");

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
    await db.$executeRaw`DELETE FROM "Job"`;
    await db.$executeRaw`DELETE FROM "User"`;
    await db.$executeRaw`
      UPDATE "sqlite_sequence" SET "seq" = 0 WHERE "name" = 'User';
    `;
    await db.$executeRaw`
      UPDATE "sqlite_sequence" SET "seq" = 0 WHERE "name" = 'Job';
    `;
    const res = await db.$executeRaw`
      INSERT INTO "User" ("name", "email", "image") 
      VALUES('Pepe', 'pepe@dummy-mail.com', 'https://ih1.redbubble.net/image.3287754550.6742/st,small,507x507-pad,600x600,f8f8f8.u2.jpg')
    `;
    await db.$executeRaw`
      INSERT INTO "Job" ("name", "description", "userId") 
      VALUES('Fix issue #99', 'none', "1")
    `;
    await db.$executeRaw`
    INSERT INTO "Job" ("name", "description", "userId") 
    VALUES('Fix issue #33',  "The endpoint /api/apples is not handling errors at the moment.", "1")
  `;

    db.$disconnect();
  } catch (e) {
    db.$disconnect();
    throw e;
  }
}
