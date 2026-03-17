const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLastDoc() {
  try {
    const doc = await prisma.documents.findFirst({
      orderBy: { id: 'desc' }
    });
    console.log("Last doc id:", doc.id);
    console.log("Files:", doc.files);
    console.log("Type of files:", typeof doc.files);
    if (Array.isArray(doc.files)) {
      console.log("Last file name:", doc.files[doc.files.length - 1]);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
checkLastDoc();
