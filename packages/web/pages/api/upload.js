// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import nodePandoc from "node-pandoc";
import fs from "fs";

const callback = function (err, result) {
  if (err) {
    console.error("Oh Nos: ", err);
  }

  // For output to files, the 'result' will be a boolean 'true'.
  // Otherwise, the converted value will be returned.
  console.log(result);
  return result;
};

export default function handler(req, res) {
  // pull in file id from req query param
  const fileId = req.query.fileId;

  const dataDir = "/Users/m1/Desktop/Data/";

  fs.readdir(dataDir, (err, files) => {
    let file = files.filter((file) => file.includes(fileId));

    if (file) {
      const absPath = `${dataDir}/${file}`;
      const data = fs.readFileSync(absPath).toString();

      //   const markdownOutputPathAbs = `${dataDir}/markdown/${file.replace(
      //     ".txt",
      //     ".md"
      //   )}`;

      const args = ["-f", "rtf", "-t", "markdown"];
      let convertedNote = nodePandoc(absPath, args, callback);
      // upload to IFPS

      let uploadResponse = fetch("http://localhost:4001/uploadJSON", {
        method: "POST",
        body: JSON.stringify({
          content: convertedNote,
          author: "",
        }),
      })
        .then((r) => r.json())
        .then((r) => {
          console.log(r);
          return res.json(r);
        });
    }
  });
  return res.json({ error: "file not found or converted yet" });
}
