import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const subdomain = req.headers.host.split(".")[0] || "";

  const account = await prisma.account.findFirst({
    where: {
      username: subdomain ? subdomain : undefined,
    },
  });

  if (!account) {
    return res.status(404).json({ message: "account not found" });
  }

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
