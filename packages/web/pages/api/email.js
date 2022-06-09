import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log("incoming email", req);

    const r = new RegExp("(icloud.com/notes/[0-9A-z-#]+)");

    // TODO: protection
    const results = r.exec(req.body.html);
    console.log({ results });
    if (results) {
      const url = results[0];

      const id = url.split("/notes/")[1].split("#")[0].trim();
      const authorName = req.body.from.name;
      // const authorEmail = req.body.from.email;
      const titleString = req.body.subject;

      let title = titleString.replace('"', "").trim();
      let messageId = req.body["message-id"];

      console.log({ messageId });

      await prisma.noteIngestion.create({
        data: {
          appleId: id,
          title: title,
          senderEmail: req.body.from.email,
          messageId: messageId,
        },
      });

      res.status(200).json({ status: "note scheduled for ingestion" });
    } else {
      res.status(200).json({ status: "no valid url found" });
    }
  }
}
