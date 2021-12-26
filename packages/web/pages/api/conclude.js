import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log(req.body);

    const { appleId } = req.body;

    const post = await prisma.post.findUnique({
      where: {
        appleId: appleId,
      },
    });
    console.log({ post });

    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    const account = await prisma.account.findUnique({
      where: {
        id: post.accountId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: "account not found" });
    }

    // TODO: change state to `concluded`
    // const pendingNote = await prisma.noteIngestion.findFirst({

    res.status(200).json({ status: "ok" });
  }
}
