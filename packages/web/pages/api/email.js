import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log("incoming email", req.body.from);

    const r = new RegExp("(https://www.icloud.com/notes/[0-9A-z-#]+)");

    // TODO: protection
    const results = r.exec(req.body.html);
    console.log({ results });
    if (results && results.length == 2) {
      const url = results[1];

      const id = url.split("/notes/")[1].split("#")[0].trim();
      const authorName = req.body.from.name;
      const authorEmail = req.body.from.email;

      let account = await prisma.account.findUnique({
        where: {
          email: authorEmail,
        },
      });

      if (!account) {
        const preferredUsername = authorEmail.split("@")[0].trim();
        const existing = await prisma.account.findUnique({
          where: {
            username: preferredUsername,
          },
        });

        if (existing && existing.length > 0) {
          const newUsername = `${preferredUsername}${existing.length}`;
          console.log("username exists, using", newUsername);
          account = await prisma.account.create({
            data: {
              username: newUsername,
              email: authorEmail,
              name: authorName,
            },
          });
        } else {
          console.log("creating account with username", preferredUsername);
          account = await prisma.account.create({
            data: {
              username: preferredUsername,
              email: authorEmail,
              name: authorName,
            },
          });
        }
      }

      const note = await prisma.post.upsert({
        create: {
          appleId: id,
          accountId: account.id,
        },
        update: {
          ipfsHash: null,
        },
        where: {
          appleId: id,
        },
      });

      res.status(200).json({ status: "note ingested" });
    } else {
      res.status(200).json({ status: "no valid url found" });
    }
  }
}
