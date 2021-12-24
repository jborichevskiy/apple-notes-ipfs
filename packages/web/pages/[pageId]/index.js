import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import showdown from "showdown";
import useSwr from "swr";

const postFetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.error);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function Page() {
  const router = useRouter();
  const { pageId } = router.query;

  const [ipfsHash, setIpfsHash] = useState("");

  const { data: postData, error: postError } = useSwr(
    pageId && `/api/lookup?id=${pageId}`,
    postFetcher
  );

  useEffect(() => {
    console.log("postError", postError);
  }, [postError]);

  useEffect(() => {
    if (postData) {
      setIpfsHash(postData.ipfsHash);
      setMarkdown(postData.content);
    }
  }, [postData]);

  //   useEffect(() => {
  //     fetch(`https://ipfs.io/ipfs/${ipfsHash}`).then((response) =>
  //       response.json().then((data) => {
  //         console.log({ data });
  //         setMarkdown(data.content);
  //       })
  //     );
  //   }, [ipfsHash]);

  useEffect(() => {
    if (!postData || !postData.content) return;

    const temporaryTimeout = setTimeout(() => {
      const target = document.getElementById("markdownContent");
      const converter = new showdown.Converter();
      const html = converter.makeHtml(postData.content);
      target.innerHTML = html;
    }, 3000);
    return () => clearTimeout(temporaryTimeout);
  }, [postData]);

  return (
    <div className="document">
      {!postData && !postError ? "loading..." : null}
      {postData && !postError ? <div id="markdownContent" /> : null}
      {postError ? postError.message : null}
      <style jsx>{`
        .document {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
