import Link from "next/link";

import styles from "@components/Footer.module.css";

const Footer = () => {
  return (
    <div className={styles.container}>
      <Link prefetch={false} href="https://notes.site" passHref>
        made by notes.site
      </Link>
    </div>
  );
};

export default Footer;
