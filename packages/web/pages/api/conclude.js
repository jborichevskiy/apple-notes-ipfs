import { PrismaClient } from "@prisma/client";
import { string_to_slug } from "./utils";

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

    const subject = `${post.title} published`;

    // send email
    sendEmail(
      account.email,
      subject,
      `your post has been created! view it here: http://${account.username}.notes.site/posts/${post.slug}

        thanks for trying notes.site`,
      `<p>your post has been created! view it <a href="http://${account.username}.notes.site/posts/${post.slug}">here</a><br>thanks for trying notes.site</p>`
    );

    res.status(200).json({ status: "ok" });
  }
}
