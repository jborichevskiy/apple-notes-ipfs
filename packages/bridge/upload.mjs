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

async function getValidSlug(desiredSlug, accountId, appleId) {
  let pendingSlug = desiredSlug;

  let existingSlug = await prisma.post.findUnique({
    where: {
      unique_account_slug: { accountId: accountId, slug: desiredSlug },
    },
  });
  console.log({ existingSlug });

  // if the same post already exists, use that slug
  if (
    existingSlug &&
    existingSlug.appleId == appleId &&
    existingSlug.accountId == accountId
  ) {
    return desiredSlug;
  }

  let currentMax = 1;
  let collisionExists = existingSlug != null;
  while (collisionExists) {
    currentMax++;
    console.log({ currentMax });
    console.log({ collisionExists });
    pendingSlug = `${desiredSlug}-${currentMax}`;
    console.log("new desired slug", pendingSlug);
    existingSlug = await prisma.post.findUnique({
      where: {
        unique_account_slug: { accountId: accountId, slug: pendingSlug },
      },
    });
    console.log({ existingSlug });
    collisionExists = existingSlug != null;
  }

  console.log(pendingSlug, "is available!");
  return pendingSlug;
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

  // convert RTF to HTML
  const command = `/usr/bin/textutil -convert html ${absPathRtf} -output ${dataDir}${pendingNote.appleId}.html`;
  console.log({ command });
  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      await prisma.noteIngestion.update({
        data: {
          status: "error - textutil",
        },
        where: {
          id: pendingNote.id,
        },
      });
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
      .replaceAll(/<meta[^>]*>.+<\/meta>/g, "");
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

    const desiredSlug = string_to_slug(pendingNote.title.substring(0, 20));
    console.log({ account, desiredSlug });

    // loops through current slugs and appends an `-n` to end
    const slug = await getValidSlug(
      desiredSlug,
      account.id,
      pendingNote.appleId
    );

    const post = await prisma.post.upsert({
      create: {
        appleId: pendingNote.appleId,
        accountId: account.id,
        ipfsHash: ipfsResponseJson.hash,
        // todo: get title from note directly, frmo text to first linebreak
        title: pendingNote.title.substring(0, 20),
        slug: slug,
        // markdownContent: generatedMarkdown,
        htmlContent: cleanedHTML,
        rtfContent: rtfContent,
        // attachments: attachmentIPFSHashes,
        // type: pendingNote.type,
      },
      update: {
        ipfsHash: ipfsResponseJson.hash,
        // markdownContent: generatedMarkdown,
        htmlContent: cleanedHTML,
        rtfContent: rtfContent,
        updatedAt: new Date(),
        // todo: double check this -- wipe all attachments before re-uploading? versioning?
        attachments: [],
        slug: slug,
      },
      where: {
        appleId: pendingNote.appleId,
      },
    });

    // upload attachments from dir

    const files = await fs.promises.readdir(dataDir);
    const noteAttachments = files.filter(
      (f) => f.includes(`${pendingNote.appleId}`) && f.includes(".png")
    );
    console.log({ noteAttachments });

    noteAttachments.map((fileName) => {
      const path = `${dataDir}${fileName}`;
      console.log({ path });
      const cmd = `curl --location --request POST 'http://137.184.218.83:3000/upload' --form '=@"${path}"' -s | python -c "import sys, json; print(json.load(sys.stdin)['hash'])"`;
      console.log({ cmd });

      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);

        if (!stdout) return;

        // get system createdAt time from file
        const createdAt = new Date(fs.statSync(path).birthtimeMs).toISOString();

        // create an attachment object
        await prisma.upload.create({
          data: {
            ipfs: stdout.trim(),
            accountId: account.id,
            postId: post.id,
            capturedAt: createdAt,
          },
        });

        return stdout.trim();
      });
    });
    // console.log({ attachmentIPFSHashes });

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
      `<p>your post has been created! view it <a href="http://${account.username}.notes.site/posts/${post.slug}">here</a>. In a few minutes, your post will be indexed on ipfs <a href="https://ipfs.io/ipfs/${ipfsResponseJson.hash}">here</a>.<br><br>thanks for trying notes.site!</p>`
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
