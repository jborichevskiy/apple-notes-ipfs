import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { exec } from "child_process";

const prisma = new PrismaClient();

async function main() {
  let entry = await prisma.note.findFirst({
    where: {
      ipfsHash: null,
    },
  });
  console.log({ entry });
  if (entry) {
    console.log(
      `passing ${entry.appleId} to KeyboardMaestro for initial ingestion`
    );
    exec(
      `osascript -e \'tell application "Keyboard Maestro Engine" to do script "C40BD8A5-4BD1-4AED-AF90-9AF9C879388C" with parameter "${entry.appleId}"\'`,
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
//   if (dbNote) {
//     console.log(`passing ${id} to KeyboardMaestro for updating`);
//     exec(
//       `osascript -e \'tell application "Keyboard Maestro Engine" to do script "27338C11-555A-40B5-A7B4-6D776867C975" with parameter "${id}"\'`,
//       (error, stdout, stderr) => {
//         if (error) {
//           console.log(`error: ${error.message}`);
//           return;
//         }
//         if (stderr) {
//           console.log(`stderr: ${stderr}`);
//           return;
//         }
//         console.log(`stdout: ${stdout}`);
//       }
//     );
//   } else {
//   }
