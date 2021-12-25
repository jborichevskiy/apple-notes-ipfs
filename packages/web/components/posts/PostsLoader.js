import { List, BulletList, Code } from "react-content-loader";

import styles from "@components/posts/PostsLoader.module.css";

const PostsLoader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingColumn}>
        <List animate className={styles.loader} />
        <List animate className={styles.loader} />
        <Code animate className={styles.codeLoader} />
        <List animate className={styles.loader} />
      </div>
      <div className={styles.loadingColumn}>
        <Code animate className={styles.codeLoader} />
        <List animate className={styles.loader} />
        <List animate className={styles.loader} />
        <Code animate className={styles.codeLoader} />
        <List animate className={styles.loader} />
      </div>
    </div>
  );
};

export default PostsLoader;
