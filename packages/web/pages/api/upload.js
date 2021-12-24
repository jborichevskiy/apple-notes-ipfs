// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import nodePandoc from "node-pandoc";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  // pull in file id from req query param
  const fileId = req.query.fileId.split("#")[0];

  const dataDir = "/Users/m1/Desktop/Data/";
  // const dataDir = "/Users/jonbo/Github/jborichevskiy/notes-icloud/data/clean/";

  fs.readdir(dataDir, (err, files) => {
    let file = files.filter((file) => file.includes(fileId));

    if (file) {
      const absPath = `${dataDir}/${file}`;

      const args = ["-f", "rtf", "-t", "gfm"];
      nodePandoc(absPath, args, (err, result) => {
        if (err) {
          return res.json({ error: err });
        }

        const data = {
          content: result,
          author: "",
        };
        console.log("uploading", data);
        // upload to IFPS
        fetch("http://137.184.218.83:3000/uploadJSON", {
          // fetch("http://localhost:4001/uploadJSON", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((r) => r.json())
          .then(async (r) => {
            console.log(r);
            const foundNote = await prisma.post.findUnique({
              where: {
                appleId: fileId,
              },
            });
            if (foundNote) {
              await prisma.post.update({
                data: {
                  content: result,
                  ipfsHash: r.hash,
                },
                where: {
                  appleId: fileId,
                },
              });
            }
            return res.json(r);
          });
      });
    } else {
      return res.json({ error: "file not found or converted yet" });
    }
  });
}
