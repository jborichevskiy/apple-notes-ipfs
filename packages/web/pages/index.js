import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");

  function handleSubmit() {
    console.log({ url });
    fetch("http://51.159.120.185:3000/api/ingest", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        url: url,
      }),
    });
  }
  return (
    <div className={styles.container}>
      <input
        onChange={(e) => setUrl(e.target.value)}
        placeholder="iCloud link"
      ></input>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
