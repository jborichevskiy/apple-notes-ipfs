import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import useSwr from "swr";

import PostsLayout from "@components/posts/PostsLayout";
import PostsLoader from "@components/posts/PostsLoader";
import PostsError from "@components/posts/PostsError";
import Centered from "@components/utils/Centered";

import styles from "@pages/posts/[slug]/[slug].module.css";

const postFetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.message);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function Page({ host }) {
  const router = useRouter();
  const { slug } = router.query;
  const subdomain = host.split(".")[0];

  const [ipfsHash, setIpfsHash] = useState("");

  const { data: postData, error: postError } = useSwr(
    slug && `/api/posts/${slug}`,
    postFetcher
  );

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

    const timeout = setTimeout(() => {
      const target = document.getElementById("content");
      target.innerHTML = postData.htmlContent;
    }, 1);
    return () => clearTimeout(timeout);
  }, [postData]);

  return (
    <PostsLayout>
      <div className={styles.container}>
        {!postData && !postError ? <PostsLoader /> : null}
        {postData && !postError ? <div id="content" /> : null}
        {postError ? <PostsError message={postError.message} /> : null}
      </div>
    </PostsLayout>
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
