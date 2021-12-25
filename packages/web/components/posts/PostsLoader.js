import { List, BulletList, Code } from "react-content-loader";

import styles from "@components/posts/PostsLoader.module.css";

const PostsLoader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingColumn}>
        <List className={styles.loader} />
        <List className={styles.loader} />
        <Code className={styles.codeLoader} />
        <List className={styles.loader} />
      </div>
      <div className={styles.loadingColumn}>
        <Code className={styles.codeLoader} />
        <List className={styles.loader} />
        <List className={styles.loader} />
        <Code className={styles.codeLoader} />
        <List className={styles.loader} />
      </div>
    </div>
  );
};

export default PostsLoader;
