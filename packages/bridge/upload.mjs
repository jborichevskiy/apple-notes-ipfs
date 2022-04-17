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

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

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

export function string_to_slug(str, preservePeriods = false) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaeeeeiiiioooouuuunc------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9\. -]/g, "") // remove invalid chars
    // replace dots with dash
    .replace(/\./g, preservePeriods ? "-" : "")
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
}

async function getAccount(preferredUsername, email) {
  let account;
  account = await prisma.account.findUnique({
    where: {
      email: email,
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

// Wait for file to exist, checks every 2 seconds by default
function getFile(path, timeout = 2000) {
  const intervalObj = setInterval(function () {
    const file = path;
    const fileExists = fs.existsSync(file);

    console.log("Checking for: ", file);
    console.log("Exists: ", fileExists);

    if (fileExists) {
      clearInterval(intervalObj);
    }
  }, timeout);
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

  const rtfBuffer = fs.readFileSync(`${dataDir}${rtfFile}`);
  const rtfContent = rtfBuffer.toString();

  const htmlPathAbs = `/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/notessite/posts/${pendingNote.appleId}.html`;
  const htmlBuffer = fs.readFileSync(htmlPathAbs);
  // const htmlContent = htmlBuffer.toString();

  const emailBuffer = fs.readFileSync(`${dataDir}${emailFile}`);
  const emailFileContent = emailBuffer.toString();

  const email = emailFileContent.trim();
  const preferredUsername = string_to_slug(email.split("@")[0], true);

  var fd = fs.openSync(`${htmlPathAbs}`, "w+");
  var buffer = Buffer.from(`<!--
Title: ${pendingNote.title
    .replace('"', "")
    .replace("“", "")
    .replace("”", "")
    .trim()}
-->
`);

  console.log("buffer.tostring", buffer.toString());
  console.log("htmlBuffer.tostring", htmlBuffer.toString());

  fs.writeSync(fd, buffer, 0, buffer.length, 0); //write new data
  fs.writeSync(fd, htmlBuffer, 0, htmlBuffer.length, htmlBuffer.length); //append old data
  // or fs.appendFile(fd, data);
  fs.close(fd);

  let account = await getAccount(preferredUsername, email);

  const desiredSlug = string_to_slug(pendingNote.title.substring(0, 20));

  const post = await prisma.post.upsert({
    create: {
      appleId: pendingNote.appleId,
      accountId: account.id,
      // todo: get title from note directly, frmo text to first linebreak
      title: pendingNote.title.replace('"', "").trim(),
      slug: pendingNote.appleId,
      // markdownContent: generatedMarkdown,
      rtfContent: rtfContent,
      // attachments: attachmentIPFSHashes,
      // type: pendingNote.type,
    },
    update: {
      // markdownContent: generatedMarkdown,
      rtfContent: rtfContent,
      updatedAt: new Date(),
      // todo: double check this -- wipe all attachments before re-uploading? versioning?
      attachments: [],
      slug: pendingNote.appleId,
    },
    where: {
      slug: pendingNote.appleId,
    },
  });

  // upload attachments from dir

  await prisma.noteIngestion.update({
    data: {
      status: "uploaded",
    },
    where: {
      id: pendingNote.id,
    },
  });

  const subject = `${post.title} published`;

  // send email
  sendEmail(
    email,
    subject,
    `your post has been created! 
    
    text version: https://beta.notes.site/${post.slug}
    scanned version: https://beta.notes.site/${post.appleId}_scan

    thanks for trying notes.site`,
    `<p>your post has been created!
     <br>text version: <a href="https://beta.notes.site/${post.slug}">here</a>
     <br>scanned version: <a href="https://beta.notes.site/${post.slug}_scan">here</a>
     <br>
     <br>thanks for trying notes.site!</p>`,
    pendingNote.messageId
  );
  const response = await fetch("https://notes.site/api/conclude", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      appleId: post.appleId,
    }),
  });
  const responseJson = await response.json();
  console.log({ responseJson });
}

await main();
