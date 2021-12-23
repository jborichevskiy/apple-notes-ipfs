import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import nodemailer from "nodemailer";
import fs from "fs";
import nodePandoc from "node-pandoc";
import fetch from "node-fetch";

const hostname = process.env.SMTP_HOST;
const username = process.env.SMTP_USERNAME;
const password = process.env.SMTP_PASSWORD;

const prisma = new PrismaClient();

function sendEmail(to, bodyText, bodyHTML) {
  console.log(`Sending email to ${to}`);
  const transporter = nodemailer.createTransport({
    host: hostname,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: username,
      pass: password,
    },
    logger: true,
  });

  const info = transporter.sendMail(
    {
      from: '"notes.site" <share@notes.site>',
      to: to,
      subject: "notes.site publish success",
      text: bodyText,
      html: bodyHTML,
      headers: {},
    },
    (res) => {
      console.log({ res });
    }
  );
}

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
        const absPath = `${dataDir}${file}`;
        console.log({ absPath });

        const args = ["-f", "rtf", "-t", "gfm"];
        nodePandoc(absPath, args, (err, result) => {
          if (err) {
            return res.json({ error: err });
          }

          const data = {
            content: result,
            author: awaitingUpload.email,
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
                console.log({ foundNote });
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

                // send email
                if (foundNote.email) {
                  sendEmail(
                    foundNote.email,
                    `your post has been created! 
                    
                    view it here: https://notes.site/page?id=${foundNote.appleId}
                    
                    you can delete it from here.`,
                    `<p>your post has been created!</p><br><br>view it <a href="https://notes.site/page?id=${foundNote.appleId}">here</a>`
                  );
                }

                // update emailSent = true
              }
            });
        });
      }
    });
  });
}

await main();
// sendEmail("jonborichef@icloud.com", "test", "<p>test</p>");
