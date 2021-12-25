import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const id = req.query.id;
  const subdomain = req.query.subdomain;

  const account = await prisma.account.findUnique({
    where: {
      username: subdomain,
    },
  });

  if (!account) {
    return res.status(404).json({ message: "account not found" });
  }

  const note = await prisma.post.findFirst({
    where: {
      appleId: id,
      accountId: account.id,
    },
  });

  if (note) {
    return res.status(200).json({
      id: id,
      ipfsHash: note.ipfsHash,
      content: note.markdownContent,
      htmlContent: note.htmlContent,
    });
  } else {
    return res.status(404).json({ message: "note not found" });
  }
}
