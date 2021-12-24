import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import showdown from "showdown";
import useSwr from "swr";

import Layout from "@components/Layout";

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

export default function Page({ host }) {
  const router = useRouter();
  const { postId } = router.query;
  const subdomain = host.split(".")[0];

  const [ipfsHash, setIpfsHash] = useState("");

  const { data: postData, error: postError } = useSwr(
    postId && `/api/lookup?id=${postId}&subdomain=${subdomain}`,
    postFetcher
  );

  useEffect(() => {
    console.log("postError", postError);
  }, [postError]);

  useEffect(() => {
    if (postData) {
      setIpfsHash(postData.ipfsHash);
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
    if (!postData || !postData.htmlContent) return;

    const temporaryTimeout = setTimeout(() => {
      const target = document.getElementById("content");
      target.innerHTML = postData.htmlContent;
    }, 3000);
    return () => clearTimeout(temporaryTimeout);
  }, [postData]);

  return (
    <Layout>
      <div className="document">
        {!postData && !postError ? "loading..." : null}
        {postData && !postError ? <div id="content" /> : null}
        {postError ? postError.message : null}
        <style jsx>{`
          .document {
            padding: 1rem;
          }
        `}</style>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=1, stale-while-revalidate=59"
  );

  return {
    props: {
      host: req.headers.host,
    },
  };
}
