import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log(req.body);

    const { email, appleId } = req.body;

    const note = await prisma.post.findUnique({
      where: {
        appleId: appleId,
      },
    });

    if (!note) {
      return res.status(404).json({ message: "note not found" });
    }

    await prisma.account.update({
      data: {
        email: email,
      },
      where: {
        id: note.accountId,
      },
    });

    res.status(200).json({ status: "ok" });
  }
}
