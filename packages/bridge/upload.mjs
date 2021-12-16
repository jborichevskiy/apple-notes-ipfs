import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import fs from "fs";
import nodePandoc from "node-pandoc";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function main() {
  let awaitingUpload = await prisma.note.findMany({
    where: {
      ipfsHash: null,
    },
  });
  console.log({ awaitingUpload });

  const dataDir = process.env.DATA_DIR;

  fs.readdir(dataDir, (err, files) => {
    awaitingUpload.forEach((note) => {
      const file = files.find((f) => f.includes(note.appleId));

      console.log({ file });

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
              const foundNote = await prisma.note.findUnique({
                where: {
                  appleId: note.appleId,
                },
              });
              if (foundNote) {
                await prisma.note.update({
                  data: {
                    content: result,
                    ipfsHash: r.hash,
                    updatedAt: new Date(),
                  },
                  where: {
                    appleId: note.appleId,
                  },
                });
              }
            });
        });
      }
    });
  });
}

await main();
//   if (dbNote) {
//     console.log(`passing ${id} to KeyboardMaestro for updating`);
//     exec(
//       `osascript -e \'tell application "Keyboard Maestro Engine" to do script "27338C11-555A-40B5-A7B4-6D776867C975" with parameter "${id}"\'`,
//       (error, stdout, stderr) => {
//         if (error) {
//           console.log(`error: ${error.message}`);
//           return;
//         }
//         if (stderr) {
//           console.log(`stderr: ${stderr}`);
//           return;
//         }
//         console.log(`stdout: ${stdout}`);
//       }
//     );
//   } else {
//   }
