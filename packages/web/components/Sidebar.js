import Link from "next/link";

import styles from "@components/Sidebar.module.css";

const Sidebar = ({ name }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{name}</h1>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <Link href="/posts">posts</Link>
        </li>
        <li className={styles.listItem}>
          <Link href="/drawings">drawings</Link>
        </li>
        <li className={styles.listItem}>
          <Link href="/me">me</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
