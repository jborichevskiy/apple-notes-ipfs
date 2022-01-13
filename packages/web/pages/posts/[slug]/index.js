import Head from "next/head";
import { useEffect } from "react";

import PostsLayout from "@components/posts/PostsLayout";
import PostsError from "@components/posts/PostsError";

import buildPageTitleString from "@utils/posts/build-page-title-string";

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

import styles from "@pages/posts/[slug]/[slug].module.css";

export default function Post({ post, error, subdomain }) {
  const { title, htmlContent, attachments } = post || {};

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

      if (attachments && attachments.length) {
        const attachmentsDiv = document.getElementById("attachments");
        console.log({ attachments });
        attachmentsDiv.innerHTML = `<h3>Attachments</h3>${attachments.map(
          (ipfsHash) => {
            return ` <a href="https://ipfs.io/ipfs/${ipfsHash}">${ipfsHash.substring(
              0,
              6
            )}</a>`;
          }
        )}`;
      }
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
        {post && !error ? <div id="content" /> : null}
        {post && !error ? <div id="attachments" className="footer" /> : null}
        {error ? <PostsError message={error.message} /> : null}
      </div>

      {/* TODO: Better co-locate the styles */}
      <style>{`
        .footer {
          margin-top: 2rem;
        }
        a {
          color: #dca10d
        }
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
        p.p6 {
          font-size: 16px;
        }
        ul.ul1 {
          list-style-type: disc;
        }
        li.li3 {
          font-size: 16px;
        }
      `}</style>
    </PostsLayout>
  );
}

export const getServerSideProps = async (context) => {
  const { req, params } = context;
  const subdomain = req.headers.host.split(".")[0] || "";
  const { slug } = params;

  // NOTE: This should be a function or imported method that makes a call to the backend.
  const account = await prisma.account.findFirst({
    where: {
      username: subdomain,
    },
  });

  if (!account) {
    return {
      subdomain,
      post: null,
      error: {
        message: "account not found",
      },
      notFound: true,
    };
  }

  // NOTE: This should be a function or imported method that makes a call to the backend.
  const post = await prisma.post.findFirst({
    where: {
      // visible: true,
      slug,
      accountId: account.id,
    },
  });

  if (!post) {
    return {
      subdomain,
      post: null,
      error: {
        message: "post not found",
      },
      notFound: true,
    };
  }

  return {
    props: {
      subdomain,
      post: {
        title: post.title,
        htmlContent: post.htmlContent,
        attachments: post.attachments,
      },
      error: null,
    },
  };
};
