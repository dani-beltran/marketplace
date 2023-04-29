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
    // Reset DB
    await db.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
    // Insert Data
    const res = await db.$queryRaw`
      INSERT INTO "User" ("name", "email", "image") 
      VALUES('Pepe', 'pepe@dummy-mail.com', 'https://ih1.redbubble.net/image.3287754550.6742/st,small,507x507-pad,600x600,f8f8f8.u2.jpg')
      RETURNING "id"
    `;
    const userId = res[0].id;
    let promises = [];
    for (let i = 0; i < 60; i++) {
      const name = `Issue #${i}`;
      const description = 'Lorem impsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      const query = db.$executeRaw`
        INSERT INTO "Job" ("name", "description", "userId", "issueUrl") 
        VALUES(${name}, ${description}, ${userId}, 'https://github.com/dani-beltran/marketplace/issues/1')
      `;
      promises.push(query);
    }
    await Promise.all(promises);
    db.$disconnect();
  } catch (e) {
    db.$disconnect();
    throw e;
  }
}
