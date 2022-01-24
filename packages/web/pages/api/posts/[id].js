import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  const post = await prisma.post.findUnique({
    where: {
      appleId: req.query.id,
    },
    // orderBy: {
    //   createdAt: "desc",
    // },
  });
  console.log({ post });

  // generate list of ipfs hashes from upload[]
  const uploads = await prisma.upload
    .query({
      where: {
        postId: post.id,
      },
      orderBy: {
        capturedAt: "asc",
      },
    })
    .map((upload) => upload.ipfsHash);

  if (post) {
    return res.status(200).json({
      title: post.title,
      ipfsHash: post.ipfsHash,
      content: post.markdownContent,
      htmlContent: post.htmlContent,
      attachments: post.attachments,
      upload: uploads,
    });
  } else {
    return res.status(404).json({ message: "post not found" });
  }
}
