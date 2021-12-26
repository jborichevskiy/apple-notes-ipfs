import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import nodemailer from "nodemailer";
import fs from "fs";
import nodePandoc from "node-pandoc";
import fetch from "node-fetch";
import { exec } from "child_process";

const dataDir = process.env.DATA_DIR;

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

async function getAccount(preferredUsername, email) {
  let account;
  account = await prisma.account.findUnique({
    where: {
      username: preferredUsername,
    },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        username: preferredUsername,
        email: email,
      },
    });
  }

  return account;
}

async function main() {
  const pendingNote = await prisma.noteIngestion.findFirst({
    where: {
      status: "processed",
    },
  });
  if (!pendingNote) return;

  const files = await fs.promises.readdir(dataDir);
  const rtfFile = files.find((f) => f.includes(`${pendingNote.appleId}.rtf`));
  const emailFile = files.find((f) =>
    f.includes(`${pendingNote.appleId}.email.txt`)
  );

  console.log({ rtfFile });

  if (!rtfFile) return;

  const absPathRtf = `${dataDir}${rtfFile}`;

  // convert RTF to HTML
  const command = `/usr/bin/textutil -convert html ${absPathRtf} -output ${dataDir}${pendingNote.appleId}.html`;
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

  const htmlBuffer = fs.readFileSync(`${dataDir}${pendingNote.appleId}.html`);
  const htmlContent = htmlBuffer.toString();

  // clean HTML -- get rid of head tag
  let cleanedHTML = htmlContent
    .replaceAll("\n", "")
    .replace(/<head[^>]*>.+<\/head>/g, "");
  cleanedHTML = cleanedHTML.replace(/<script[^>]*>.+<\/script>/g, "");
  // TODO: pre formatted text

  const rtfBuffer = fs.readFileSync(`${dataDir}${rtfFile}`);
  const rtfContent = rtfBuffer.toString();

  const emailBuffer = fs.readFileSync(`${dataDir}${emailFile}`);
  const emailFileContent = emailBuffer.toString();

  const postDataToIPFS = {
    markdown: generatedMarkdown,
    html: cleanedHTML,
    rtf: rtfContent,
    created: new Date(),
    // author: pendingNote.author,
    id: pendingNote.appleId,
  };

  console.log("uploading", postDataToIPFS);

  // upload to IFPS
  const ipfsResponse = await fetch("http://137.184.218.83:3000/uploadJSON", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(postDataToIPFS),
  });

  const ipfsResponseJson = await ipfsResponse.json();
  console.log(ipfsResponseJson);

  const preferredUsername = string_to_slug(email.split("@")[0].trim(), true);

  let account = await getAccount(preferredUsername);

  await prisma.noteIngestion.update({
    data: {
      status: "uploaded",
    },
    where: {
      appleId: appleId,
    },
  });

  const post = await prisma.post.upsert({
    create: {
      appleId: pendingNote.appleId,
      accountId: account.id,
      ipfsHash: ipfsResponseJson.hash,
      title: pendingNote.title,
      markdownContent: generatedMarkdown,
      htmlContent: cleanedHTML,
      rtfContent: rtfContent,
    },
    update: {
      ipfsHash: ipfsResponseJson.hash,
      markdownContent: generatedMarkdown,
      htmlContent: cleanedHTML,
      rtfContent: rtfContent,
      updatedAt: new Date(),
    },
    where: {
      appleId: pendingNote.appleId,
    },
  });
}

await main();
