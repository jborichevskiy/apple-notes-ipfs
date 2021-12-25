import { useMemo } from "react";
import Head from "next/head";

import Sidebar from "@components/Sidebar";
import Footer from "@components/Footer";

import styles from "@components/posts/PostsLayout.module.css";

const PostsLayout = ({ children }) => {
  const pageName = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.hostname
      .replace(".notes.site", "")
      .replace(".localhost", "");
  }, []);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Sidebar name={pageName} />
      </aside>
      <main className={styles.body}>{children}</main>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
};

export default PostsLayout;
