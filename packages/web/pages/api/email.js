import { PrismaClient } from "@prisma/client";
import { string_to_slug } from "./utils";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log("incoming email", req.body);

    const r = new RegExp("(https://www.icloud.com/notes/[0-9A-z-#]+)");

    // TODO: protection
    const results = r.exec(req.body.html);
    console.log({ results });
    if (results && results.length == 2) {
      const url = results[1];

      const id = url.split("/notes/")[1].split("#")[0].trim();
      const authorName = req.body.from.name;
      // const authorEmail = req.body.from.email;
      const titleString = req.body.subject;

      let title;
      title = titleString.substr(1, titleString.length - 2);

      await prisma.post.upsert({
        create: {
          appleId: id,
          title: title,
          slug: string_to_slug(title),
        },
        update: {
          ipfsHash: null,
          // todo: versions
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
