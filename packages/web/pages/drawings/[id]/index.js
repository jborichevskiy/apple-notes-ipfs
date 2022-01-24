import Head from "next/head";
import { useEffect } from "react";

import PostsError from "@components/posts/PostsError";

import buildPageTitleString from "@utils/posts/build-page-title-string";

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

import styles from "@pages/drawings/[id]/[id].module.css";

export default function Drawing({ drawing, error }) {
  const { title, uploads } = drawing || {};

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
        {drawing && !error ? (
          <div className={styles.drawings}>
            {drawing.uploads.map((upload) => (
              <img
                key={upload.ipfs}
                src={`https://ipfs.io/ipfs/${upload.ipfs}`}
              />
            ))}
          </div>
        ) : null}
        {error ? <PostsError message={error.message} /> : null}
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
  let drawing;

  // NOTE: This should be a function or imported method that makes a call to the backend.
  if (context.query?.id) {
    drawing = await prisma.post.findUnique({
      where: {
        // visible: true,
        appleId: context.query?.id,
      },
      include: {
        uploads: {
          select: {
            createdAt: false,
            capturedAt: false,
            updatedAt: false,
            ipfs: true,
          },
        },
      },
    });
    // let transformed = drawing.uploads.map((drawing) => {
    //   return {
    //     ipfs: drawing.ipfs,
    //     url: `https://ipfs.io/ipfs/${drawing.ipfs}`,
    //   };
    // });
  }

  if (!drawing) {
    return {
      props: {
        drawing: null,
        error: {
          message: "post not found",
        },
      },
    };
  }

  console.log({ drawing });
  return {
    props: {
      drawing: {
        title: drawing.title,
        uploads: drawing.uploads,
      },
      error: null,
    },
  };
};
