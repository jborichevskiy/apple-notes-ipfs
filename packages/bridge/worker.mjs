import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { exec } from "child_process";

const prisma = new PrismaClient();

async function main() {
  let queuedNote = await prisma.noteIngestion.findFirst({
    where: {
      status: "pending",
    },
  });
  console.log({ queuedNote });

  if (queuedNote) {
    console.log(
      `passing ${queuedNote.appleId} to KeyboardMaestro for initial ingestion`
    );
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "2D7CFB8D-19E9-457F-B0E5-8E46495BB12F" with parameter "${queuedNote.appleId}"\'`,
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
