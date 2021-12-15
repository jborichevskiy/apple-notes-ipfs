const { exec } = require("child_process");

export default function handler(req, res) {
  console.log(req.body);
  console.log(req.data);
  // TODO: implenent queueing/signaling while task in progress
  //   launch KeyboardMaestro script
  exec(
    `osascript -e \'tell application "Keyboard Maestro Engine" to do script "C40BD8A5-4BD1-4AED-AF90-9AF9C879388C" with parameter "${req.body.url}"\'`,
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
