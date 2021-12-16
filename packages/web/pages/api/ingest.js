const { exec } = require("child_process");
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(req.body);
  const id = req.body.url.split("/notes/")[1].split("#")[0];
  // TODO: implenent queueing/signaling while task in progress

  const dbNote = await prisma.note.findUnique({
    where: {
      appleId: id,
    },
  });

  if (dbNote) {
    console.log(`passing ${id} to KeyboardMaestro for updating`);
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "27338C11-555A-40B5-A7B4-6D776867C975" with parameter "${id}"\'`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      }
    );
  } else {
    console.log(`passing ${id} to KeyboardMaestro for initial ingestion`);
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "C40BD8A5-4BD1-4AED-AF90-9AF9C879388C" with parameter "${id}"\'`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      }
    );
  }

  await prisma.note.upsert({
    create: {
      appleId: id,
    },
    update: {
      appleId: id,
    },
    where: {
      appleId: id,
    },
  });

  res.status(200).json({ status: "ok" });
}
