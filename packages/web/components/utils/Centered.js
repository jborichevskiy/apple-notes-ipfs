import styles from "@components/utils/Centered.module.css";

const Centered = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

export default Centered;
