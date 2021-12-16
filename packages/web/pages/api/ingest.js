import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(req.body);
  const id = req.body.url.split("/notes/")[1].split("#")[0];

  await prisma.note.upsert({
    create: {
      appleId: id,
    },
    update: {
      appleId: id,
    },
    where: {
      appleId: id,
    },
  });

  res.status(200).json({ status: "ok" });
}
