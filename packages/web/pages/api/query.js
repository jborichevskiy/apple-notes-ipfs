import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const subdomain = req.headers.host.split(".")[0] || "";
  const id = req.query.id || "";

  // return res.json({
  //   posts: [
  //     { ipfsHash: "123123", title: "hello world", appleId: "123123" },
  //     { ipfsHash: "12222", title: "another post", appleId: "123222" },
  //   ],
  // });

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
