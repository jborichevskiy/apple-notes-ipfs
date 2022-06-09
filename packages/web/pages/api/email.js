import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
import nodemailer from "nodemailer";

const hostname = process.env.SMTP_HOST;
const username = process.env.SMTP_USERNAME;
const password = process.env.SMTP_PASSWORD;

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

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log("incoming email", req);

    const r = new RegExp("(icloud.com/notes/[0-9A-z-#]+)");

    // TODO: protection
    const results = r.exec(req.body.html);
    console.log({ results });
    if (results) {
      const url = results[0];

      const id = url.split("/notes/")[1].split("#")[0].trim();
      const authorName = req.body.from.name;
      // const authorEmail = req.body.from.email;
      const titleString = req.body.subject;

      let title = titleString.replace('"', "").trim();
      let messageId = req.body["message-id"];

      console.log({ messageId });

      await prisma.noteIngestion.create({
        data: {
          appleId: id,
          title: title,
          senderEmail: req.body.from.email,
          messageId: messageId,
        },
      });

      console.log('sending ack email')
      sendEmail(
        req.body.from.email,
        `notes.site received your share`,
        "your note is now queued for sharing. We'll send you an email once it's ready.",
        `<p>your note is now queued for sharing. We'll send you an email once it's ready.</p>`
      );

      res.status(200).json({ status: "note scheduled for ingestion" });
    } else {
      res.status(200).json({ status: "no valid url found" });
    }
  }
}
