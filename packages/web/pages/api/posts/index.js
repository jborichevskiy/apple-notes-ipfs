import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  // titles vs id vs hash
  const posts = await prisma.post.findMany({
    where: {
      // visible: true,
      accountId: account.id,
    },
    select: {
      id: true,
      appleId: true,
      ipfsHash: true,
      title: true,
      markdownContent: true,
      slug: true,
    },
  });

  return res.status(200).json({ posts: posts });
}
