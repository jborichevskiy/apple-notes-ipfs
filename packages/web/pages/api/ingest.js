const { exec } = require("child_process");

export default function handler(req, res) {
  console.log(req.body);
  console.log(req.data);
  //   launch KeyboardMaestro script
  exec(
    `osascript -e \'tell application "Keyboard Maestro Engine" to do script "70DD60CF-5422-4F50-887C-1C1513CA87B3" with parameter "${req.body.url}"\'`,
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

  res.status(200).json({ name: "John Doe" });
}
