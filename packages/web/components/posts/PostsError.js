import styles from "@components/posts/PostsError.module.css";

const PostsError = ({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <span className={styles.icon}>!</span>
        <b>Something went wrong!</b>
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
