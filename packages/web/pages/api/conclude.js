import { PrismaClient } from "@prisma/client";
import { string_to_slug } from "./utils";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log(req.body);

    const { email, appleId } = req.body;

    const post = await prisma.post.findUnique({
      where: {
        appleId: appleId,
      },
    });
    console.log({ post });

    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    if (post.accountId) {
      return res.status(200).json({
        message: "post already has an account associated with it",
      });
    } else {
      const preferredUsername = string_to_slug(
        email.split("@")[0].trim(),
        true
      );

      const existing = await prisma.account.findUnique({
        where: {
          username: preferredUsername,
        },
      });

      let account;
      if (!existing) {
        console.log("creating account with username", preferredUsername);
        account = await prisma.account.create({
          data: {
            username: preferredUsername,
            email: email,
            // name: authorName,
          },
        });
      } else {
        const newUsername = `${preferredUsername}1`;
        console.log("username exists, using", newUsername);
        account = await prisma.account.create({
          data: {
            username: newUsername,
            email: email,
            // name: authorName,
          },
        });
      }

      await prisma.post.update({
        data: {
          accountId: account.id,
        },
        where: {
          appleId: appleId,
        },
      });
    }

    res.status(200).json({ status: "ok" });
  }
}
