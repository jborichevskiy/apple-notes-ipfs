import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaeeeeiiiioooouuuunc------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
}

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
      const authorEmail = req.body.from.email;
      const titleString = req.body.subject;

      let title;
      // if (titleString.startsWith('"') && titleString.endsWith('"')) {
      title = titleString.substr(1, titleString.length - 2);
      // } else {
      //   title = titleString;
      // }
      // console.log({ title });

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
        console.log({ existing });

        if (!account && existing) {
          const newUsername = `${preferredUsername}1`;
          console.log({ newUsername });
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
          title: title,
          slug: string_to_slug(title),
          accountId: account.id,
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
