import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log("incoming email");
    console.log(req.body.html);

    const r = new RegExp("(https://www.icloud.com/notes/[0-9A-z-#]+)");

    const results = r.exec(req.body.html);
    if (results.length == 2) {
      const url = results[1];

      const id = url.split("/notes/")[1].split("#")[0].trim();
      const authorName = req.body.from.name;
      const authorEmail = req.body.from.email;

      const note = await prisma.note.upsert({
        create: {
          appleId: id,
          author: authorName,
          email: authorEmail,
        },
        update: {
          author: authorName,
          email: authorEmail,
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
