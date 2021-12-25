import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import nodemailer from "nodemailer";
import fs from "fs";
import nodePandoc from "node-pandoc";
import fetch from "node-fetch";
import { exec } from "child_process";

const hostname = process.env.SMTP_HOST;
const username = process.env.SMTP_USERNAME;
const password = process.env.SMTP_PASSWORD;

const prisma = new PrismaClient();

function sendEmail(to, subject, bodyText, bodyHTML) {
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

  transporter.sendMail(
    {
      from: '"notes.site" <share@notes.site>',
      to: to,
      subject: subject,
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
  let awaitingUpload = await prisma.post.findMany({
    where: {
      ipfsHash: null,
    },
  });
  console.log({ awaitingUpload });

  const dataDir = process.env.DATA_DIR;

  fs.readdir(dataDir, (err, files) => {
    awaitingUpload.forEach((note) => {
      const rtfFile = files.find((f) => f.includes(`${note.appleId}.rtf`));
      // const htmlFile = files.find((f) => f.includes(`${note.appleId}.html`));

      console.log({ rtfFile });

      if (rtfFile) {
        const absPathRtf = `${dataDir}${rtfFile}`;

        // convert RTF to HTML
        const command = `/usr/bin/textutil -convert html ${absPathRtf} -output ${dataDir}${note.appleId}.html`;
        console.log({ command });
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        });

        // create our markdown file
        const args = ["-f", "rtf", "-t", "gfm"];
        nodePandoc(absPathRtf, args, (err, generatedMarkdown) => {
          if (err) {
            return res.json({ error: err });
          }

          const htmlBuffer = fs.readFileSync(`${dataDir}${note.appleId}.html`);
          const htmlContent = htmlBuffer.toString();

          // clean HTML -- get rid of head tag
          let cleanedHTML = htmlContent
            .replaceAll("\n", "")
            .replace(/<head[^>]*>.+<\/head>/g, "");
          cleanedHTML = cleanedHTML.replace(/<script[^>]*>.+<\/script>/g, "");
          // TODO: pre formatted text

          const rtfBuffer = fs.readFileSync(`${dataDir}${rtfFile}`);
          const rtfContent = rtfBuffer.toString();

          const data = {
            markdown: generatedMarkdown,
            html: cleanedHTML,
            rtf: rtfContent,
            created: new Date(),
            author: note.author,
            id: note.appleId,
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
                  appleId: note.appleId,
                },
              });
              if (foundNote) {
                await prisma.post.update({
                  data: {
                    ipfsHash: r.hash,
                    updatedAt: new Date(),
                    markdownContent: generatedMarkdown,
                    htmlContent: cleanedHTML,
                    rtfContent: rtfContent,
                  },
                  where: {
                    appleId: note.appleId,
                  },
                });

                const account = await prisma.account.findUnique({
                  where: {
                    id: foundNote.accountId,
                  },
                });

                const subject = `${foundNote.title} published`;

                // send email
                if (account && account.email) {
                  sendEmail(
                    account.email,
                    subject,
                    `your post has been created! view it here: http://${account.username}.notes.site/posts/${foundNote.slug}

                    thanks for trying notes.site`,
                    `<p>your post has been created! view it <a href="http://${account.username}.notes.site/posts/${foundNote.slug}">here</a><br>thanks for trying notes.site</p>`
                  );
                } else {
                  console.log("skipping email notification");
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
