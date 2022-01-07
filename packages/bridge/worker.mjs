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
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "12A289FF-7FC1-45F7-B111-065017FDADC6" with parameter "${queuedNote.appleId}"\'`,
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
