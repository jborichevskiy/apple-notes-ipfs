import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const id = req.query.id;
  const slug = req.query.slug;
  const subdomain = req.headers.host.split(".")[0] || "";
  console.log({ id, slug, subdomain });

  const account = await prisma.account.findUnique({
    where: {
      username: subdomain,
    },
  });

  if (!account) {
    return res.status(404).json({ message: "account not found" });
  }

  const post = await prisma.post.findFirst({
    where: {
      appleId: id,
      slug,
      accountId: account.id,
    },
  });

  if (post) {
    return res.status(200).json({
      id: id,
      ipfsHash: post.ipfsHash,
      content: post.markdownContent,
      htmlContent: post.htmlContent,
    });
  } else {
    return res.status(404).json({ message: "post not found" });
  }
}
