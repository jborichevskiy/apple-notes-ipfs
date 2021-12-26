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

  // convert RTF to HTML
  const command = `/usr/bin/textutil -convert html ${absPathRtf} -output ${dataDir}${pendingNote.appleId}.html`;
  console.log({ command });
  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      // await prisma.noteIngestion.update({
      //   data: {
      //     status: "error - textutil",
      //   },
      //   where: {
      //     id: pendingNote.id,
      //   },
      // });
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);

    const htmlPathAbs = `${dataDir}${pendingNote.appleId}.html`;
    // getFile(htmlPathAbs);
    const htmlBuffer = fs.readFileSync(htmlPathAbs);
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
      // markdown: generatedMarkdown,
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

    const email = emailFileContent.trim();
    const preferredUsername = string_to_slug(email.split("@")[0], true);

    let account = await getAccount(preferredUsername, email);

    const post = await prisma.post.upsert({
      create: {
        appleId: pendingNote.appleId,
        accountId: account.id,
        ipfsHash: ipfsResponseJson.hash,
        title: pendingNote.title,
        // markdownContent: generatedMarkdown,
        htmlContent: cleanedHTML,
        rtfContent: rtfContent,
      },
      update: {
        ipfsHash: ipfsResponseJson.hash,
        // markdownContent: generatedMarkdown,
        htmlContent: cleanedHTML,
        rtfContent: rtfContent,
        updatedAt: new Date(),
      },
      where: {
        appleId: pendingNote.appleId,
      },
    });

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
      `your post has been created! view it here: http://${account.username}.notes.site/posts/${post.slug}

        thanks for trying notes.site`,
      `<p>your post has been created! view it <a href="http://${account.username}.notes.site/posts/${post.slug}">here</a><br>thanks for trying notes.site</p>`
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
  });
}

await main();
