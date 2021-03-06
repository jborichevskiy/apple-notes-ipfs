import PostsLayout from "@components/posts/PostsLayout";
import useSwr from "swr";
import { useState, useEffect } from "react";

const postFetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    console.log({ data });
    const error = new Error(data.error);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function Posts() {
  const { data: postData, error: postError } = useSwr(
    `/api/posts`,
    postFetcher
  );

  useEffect(() => {
    console.log("postError", postError);
  }, [postError]);

  return (
    <PostsLayout>
      <div>
        <ul>
          {postData &&
            postData.posts.map((post) => {
              return (
                <li key={post.appleId}>
                  <a href={`posts/${post.slug}`}>{post.title}</a>
                </li>
              );
            })}
        </ul>
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
