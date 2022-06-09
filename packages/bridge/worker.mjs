import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { exec } from "child_process";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

const hostname = process.env.SMTP_HOST;
const username = process.env.SMTP_USERNAME;
const password = process.env.SMTP_PASSWORD;

function sendEmail(to, subject, bodyText, bodyHTML, replyMessageId) {
  console.log(`Sending email to ${to}`);
  console.log(hostname, username)
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

  let headers = {};
  if (replyMessageId != null) {
    headers = {
      "In-Reply-To": replyMessageId,
      References: replyMessageId,
    };
  }

  console.log({ headers });
  transporter.sendMail(
    {
      from: '"notes.site" <share@notes.site>',
      to: to,
      subject: subject,
      text: bodyText,
      html: bodyHTML,
      headers: headers,
    },
    (res) => {
      console.log({ res });
    }
  );
}

async function main() {
  let queuedNote = await prisma.noteIngestion.findFirst({
    where: {
      status: "pending",
    },
  });
  console.log({ queuedNote });

  if (queuedNote) {
    // sending email

    sendEmail(
      queuedNote.senderEmail,
      `notes.site received your share`,
      "your note is now queued for sharing. We'll send you an email once it's ready.",
      `<p>your note is now queued for sharing. We'll send you an email once it's ready.</p>`,
      queuedNote.messageId
    );

    console.log(
      `passing ${queuedNote.appleId} to KeyboardMaestro for initial ingestion`
    );
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "22F0CBBC-38BA-496D-A5D7-68EB025E8B7E" with parameter "${queuedNote.appleId}"\'`,
      async (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          await prisma.noteIngestion.update({
            data: {
              status: "error - keyboard maestro error",
            },
            where: {
              id: queuedNote.id,
            },
          });
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          await prisma.noteIngestion.update({
            data: {
              status: "error - keyboard maestro error",
            },
            where: {
              id: queuedNote.id,
            },
          });
          return;
        }
        // clear all the all uploads on this post
        await prisma.upload.updateMany({
          data: {
            postId: null,
          },
          where: {
            postId: queuedNote.id,
          },
        });

        console.log(`stdout: ${stdout}`);
        await prisma.noteIngestion.update({
          data: {
            status: "processed",
          },
          where: {
            id: queuedNote.id,
          },
        });
      }
    );
  }
}

await main();
