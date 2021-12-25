import styles from "@components/posts/PostsError.module.css";

const PostsError = ({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <span className={styles.icon}>⚠️</span>
        <span>Something went wrong!</span>
        <div className={styles.messageContainer}>
          <pre>{JSON.stringify(message, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default PostsError;
