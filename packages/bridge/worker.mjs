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
}

await main();
