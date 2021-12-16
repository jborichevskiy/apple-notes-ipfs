import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const id = req.query.id;
  const note = await prisma.note.findUnique({
    where: {
      appleId: id,
    },
  });
  if (note) {
    return res
      .status(200)
      .json({ id: id, ipfsHash: note.ipfsHash, content: note.content });
  } else {
    return res.json({ error: "note not found" });
  }
}