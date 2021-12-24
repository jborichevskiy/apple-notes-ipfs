import styles from "@components/Layout.module.css";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Sidebar name="Jonbo" />
      </aside>
      <main className={styles.body}>{children}</main>
    </div>
  );
};

export default Layout;
