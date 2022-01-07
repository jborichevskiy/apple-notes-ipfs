// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import nodePandoc from "node-pandoc";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  // todo: auth
  if (req.method == "POST") {
    const data = await req.body;

    console.log({ data });

    // validate note exists
    const post = await prisma.post.findUnique({
      where: {
        appleId: data.appleId,
      },
    });
    console.log({ post });
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    let attachments = post.attachments ? post.attachments : [];
    console.log({ attachments });
    // check if attachment already exists in string array
    if (!attachments.includes(data.ipfs)) {
      attachments.push(data.ipfs);
    }

    await prisma.post.update({
      data: {
        attachments: attachments,
      },
      where: {
        appleId: data.appleId,
      },
    });

    const updated = await prisma.post.findUnique({
      where: {
        appleId: data.appleId,
      },
    });

    return res.json({ status: "ok", post: updated });
  }
}
