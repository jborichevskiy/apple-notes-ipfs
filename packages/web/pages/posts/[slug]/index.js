import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useMemo } from "react";
import useSwr from "swr";

import PostsLayout from "@components/posts/PostsLayout";
import PostsLoader from "@components/posts/PostsLoader";
import PostsError from "@components/posts/PostsError";

import buildPageTitleString from "@utils/posts/build-page-title-string";

import styles from "@pages/posts/[slug]/[slug].module.css";

export default function Post() {
  const { query } = useRouter();
  const { slug } = query;
  const subdomain = useMemo(() => {
    if (typeof window === "undefined") return;
    return window.location.hostname.split(".")[0];
  }, []);

  const { data: postData, error: postError } = useSwr(
    slug && `/api/posts/${slug}`
  );
  const { title, htmlContent } = postData || {};

  // const [ipfsHash, setIpfsHash] = useState("");

  // useEffect(() => {
  //   if (postData) {
  //     setIpfsHash(postData.ipfsHash);
  //   }
  // }, [postData]);

  //   useEffect(() => {
  //     fetch(`https://ipfs.io/ipfs/${ipfsHash}`).then((response) =>
  //       response.json().then((data) => {
  //         console.log({ data });
  //         setMarkdown(data.content);
  //       })
  //     );
  //   }, [ipfsHash]);

  useEffect(() => {
    if (!htmlContent) return;

    const timeout = setTimeout(() => {
      const target = document.getElementById("content");
      target.innerHTML = htmlContent;
    }, 1);
    return () => clearTimeout(timeout);
  }, [htmlContent]);

  return (
    <PostsLayout>
      <Head>
        <title>{buildPageTitleString(title, subdomain)}</title>
        <meta property="og:title" content={title} key="title" />
        <meta property="og:site_name" content={`${subdomain}.notes.site`} />
        <meta property="og:url" content={`https://${subdomain}.notes.site`} />
        <meta property="og:type" content="article" />
      </Head>
      <div className={styles.container}>
        {!postData && !postError ? <PostsLoader /> : null}
        {postData && !postError ? <div id="content" /> : null}
        {postError ? <PostsError message={postError.message} /> : null}
      </div>

      {/* TODO: Better co-locate the styles */}
      <style>{`
        p.p1 {
          font-size: 32px;
        }
        p.p2 {
          font-size: 24px;
        }
        p.p3 {
          font-size: 16px;
        }
        p.p4 {
          font-size: 16px;
          font-family: monospace;
        }
        p.p5 {
          font-size: 16px;
        }
      `}</style>
    </PostsLayout>
  );
}
