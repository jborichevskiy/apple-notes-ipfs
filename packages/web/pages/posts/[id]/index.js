import Head from "next/head";
import { useEffect } from "react";

import Footer from "@components/Footer";
import PostsError from "@components/posts/PostsError";

import buildPageTitleString from "@utils/posts/build-page-title-string";

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

import styles from "@pages/posts/[id]/[id].module.css";

export default function Post({ post, error }) {
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
    <>
      <Head>
        <title>{buildPageTitleString(title)}</title>
        <meta property="og:title" content={title} key="title" />
        <meta property="og:site_name" content="notes.site" />
        <meta property="og:url" content="https://notes.site" />
        <meta property="og:type" content="article" />
      </Head>
      <div className={styles.container}>
        <div className={styles.content}>
          {post && !error ? <div id="content" /> : null}
        </div>
        {/* {post && !error ? <div id="attachments" className="footer" /> : null} */}
        {error ? <PostsError message={error.message} /> : null}
        <div className={styles.footer}>{/* <Footer /> */}</div>
      </div>

      {/* TODO: Better co-locate the styles */}
      <style>{`
        .footer {
          margin-top: 2rem;
        }
        a, a > span, a > span > b {
          color: #dca10d !important;
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
          // font-family: monospace;
        }
        p.p5 {
          font-size: 16px;
        }
        p.p6 {
          font-size: 16px;
        }
        ul.ul1, ul.ul3, ul.ul5 {
          list-style-type: disc;
          color: white;
        }
        li.li1, li.li3, li.li5 {
          font-size: 16px;
          color: white;
        }
        span.s1, span.s2, span.s3, span.s4, span.s5 {
          color: white;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = async (context) => {
  console.log(context);

  let post;

  // NOTE: This should be a function or imported method that makes a call to the backend.
  if (context.query?.id) {
    post = await prisma.post.findUnique({
      where: {
        // visible: true,
        appleId: context.query?.id,
      },
    });
  }

  if (!post) {
    return {
      props: {
        post: null,
        error: {
          message: "post not found",
        },
      },
    };
  }

  return {
    props: {
      post: {
        title: post.title,
        htmlContent: post.htmlContent,
        attachments: post.attachments,
      },
      error: null,
    },
  };
};
