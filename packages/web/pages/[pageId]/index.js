import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import showdown from "showdown";

export default function Page() {
  const [ipfsHash, setIpfsHash] = useState("");
  const [markdown, setMarkdown] = useState("");

  const router = useRouter();
  console.log("🚀 ~ file: index.js ~ line 10 ~ Page ~ router", router)
  const { pageId } = router.query;

  useEffect(() => {
    if (pageId) {
      fetch(`/api/lookup?id=${pageId}`).then((response) =>
        response.json().then((data) => {
          setIpfsHash(data.ipfsHash);
          setMarkdown(data.content);
        })
      );
    }
  }, [pageId]);

  //   useEffect(() => {
  //     fetch(`https://ipfs.io/ipfs/${ipfsHash}`).then((response) =>
  //       response.json().then((data) => {
  //         console.log({ data });
  //         setMarkdown(data.content);
  //       })
  //     );
  //   }, [ipfsHash]);

  useEffect(() => {
    const a = setTimeout(() => {
      const target = document.getElementById("markdownContent");
      const converter = new showdown.Converter();
      const html = converter.makeHtml(markdown);
      target.innerHTML = html;
    }, 3000);
    return () => clearTimeout(a);
  }, [markdown]);

  return (
    <div className="document">
      <div id="markdownContent">loading...</div>
      <style jsx>{`
        .document {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
