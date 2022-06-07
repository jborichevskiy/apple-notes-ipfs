import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import fs from "fs";
import fetch from "node-fetch";
import { exec } from "child_process";
import nodemailer from "nodemailer";

const dataDir = process.env.DATA_DIR;
const hostname = process.env.SMTP_HOST;
const username = process.env.SMTP_USERNAME;
const password = process.env.SMTP_PASSWORD;

const prisma = new PrismaClient();

function sendEmail(to, subject, bodyText, bodyHTML, replyMessageId) {
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
  const pendingNote = await prisma.noteIngestion.findFirst({
    where: {
      status: "processed",
    },
  });

  if (!pendingNote) return;

  const email = pendingNote.senderEmail;
  const subject = `notes.site published your note`;

  // send email
  sendEmail(
    email,
    subject,
    `your post has been created! 
    
    https://beta.notes.site/${pendingNote.appleId}_scan

    thanks for trying notes.site`,
    `<p>your post has been created!
     <br><a href="https://beta.notes.site/${pendingNote.appleId}_scan">view it here</a>
     <br>
     <br>thanks for trying notes.site!</p>`,
    pendingNote.messageId
  );

  // update noteIngestion
  await prisma.noteIngestion.update({
    where: {
      id: pendingNote.id,
    },
    data: {
      status: "delivered",
    }
  })
}

await main();