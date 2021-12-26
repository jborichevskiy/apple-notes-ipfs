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
  let postsAwaitingUpload = await prisma.post.findMany({
    where: {
      ipfsHash: null,
    },
  });
  console.log({ postsAwaitingUpload });

  const dataDir = process.env.DATA_DIR;

  fs.readdir(dataDir, (err, files) => {
    postsAwaitingUpload.forEach((post) => {
      const rtfFile = files.find((f) => f.includes(`${post.appleId}.rtf`));
      // const htmlFile = files.find((f) => f.includes(`${post.appleId}.html`));

      console.log({ rtfFile });

      if (rtfFile) {
        const absPathRtf = `${dataDir}${rtfFile}`;

        // convert RTF to HTML
        const command = `/usr/bin/textutil -convert html ${absPathRtf} -output ${dataDir}${post.appleId}.html`;
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

          const htmlBuffer = fs.readFileSync(`${dataDir}${post.appleId}.html`);
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
            author: post.author,
            id: post.appleId,
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
              let foundPost = await prisma.post.findUnique({
                where: {
                  appleId: note.appleId,
                },
              });
              if (foundPost) {
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

                console.log("pre-fetch", foundPost);

                foundPost = await prisma.post.findUnique({
                  where: {
                    appleId: note.appleId,
                  },
                });

                console.log("post-fetch", foundPost);

                const account = await prisma.account.findUnique({
                  where: {
                    id: foundPost.accountId,
                  },
                });

                const subject = `${foundPost.title} published`;

                // send email
                if (account && account.email) {
                  sendEmail(
                    account.email,
                    subject,
                    `your post has been created! view it here: http://${account.username}.notes.site/posts/${foundPost.slug}

                    thanks for trying notes.site`,
                    `<p>your post has been created! view it <a href="http://${account.username}.notes.site/posts/${foundPost.slug}">here</a><br>thanks for trying notes.site</p>`
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
