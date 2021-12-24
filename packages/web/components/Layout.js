import styles from "@components/Layout.module.css";
import Sidebar from "@components/Sidebar";
import Footer from "@components/Footer";

const Layout = ({ children }) => {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Sidebar name="Jonbo" />
      </aside>
      <main className={styles.body}>{children}</main>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
