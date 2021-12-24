import Link from "next/link";

import styles from "@components/Footer.module.css";

const Footer = () => {
  return (
    <div className={styles.container}>
      <Link prefetch={false} href="https://notes.site">
        <a>made by notes.site</a>
      </Link>
    </div>
  );
};

export default Footer;
