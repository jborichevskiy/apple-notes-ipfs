import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { exec } from "child_process";

const prisma = new PrismaClient();

async function main() {
  let queuedNote = await prisma.noteIngestion.findFirst({ where: {} });
  console.log({ queuedNote });

  if (queuedNote) {
    console.log(
      `passing ${queuedNote.appleId} to KeyboardMaestro for initial ingestion`
    );
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "C40BD8A5-4BD1-4AED-AF90-9AF9C879388C" with parameter "${queuedNote.appleId}"\'`,
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
            status: "processing",
          },
          where: {
            appleId: appleId,
          },
        });
      }
    );
  }
}

await main();
