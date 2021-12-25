import styles from "@components/posts/PostsError.module.css";

const PostsError = ({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <span className={styles.icon}>⚠️</span>
        <span>Something went wrong!</span>
        {message && (
          <div className={styles.messageContainer}>
            <span>{JSON.stringify(message, null, 2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsError;
