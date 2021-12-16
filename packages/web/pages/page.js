import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Page() {
  const [pageId, setPageId] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [markdown, setMarkdown] = useState("");

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) {
      return;
    }
    console.log({ id });
    setPageId(id);
  }, [id]);

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
    const target = document.getElementById("targetDiv");
    const converter = new showdown.Converter();
    const html = converter.makeHtml(markdown);
    target.innerHTML = html;
  }, [markdown]);

  return (
    <div className="document">
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"
        async
        integrity="sha512-L03kznCrNOfVxOUovR6ESfCz9Gfny7gihUX/huVbQB9zjODtYpxaVtIaAkpetoiyV2eqWbvxMH9fiSv5enX7bw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      ></script>
      <div id="targetDiv"></div>
      <style jsx>{`
        .document {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
