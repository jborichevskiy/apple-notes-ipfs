import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [noteData, setNoteData] = useState({});

  async function handleCheckStatus() {
    const id = url.split("/notes/")[1].split("#")[0];
    const response = await fetch(`/api/lookup?id=${id}`);
    const responseJson = await response.json();
    console.log({ responseJson });
    setNoteData(responseJson);
  }

  function handleSubmit() {
    console.log({ url });
    fetch("/api/ingest", {
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
    <div className={styles.container} className="col">
      <input
        onChange={(e) => setUrl(e.target.value)}
        placeholder="iCloud link"
      ></input>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleCheckStatus}>Check Status</button>
      {noteData && noteData.ipfsHash && (
        <a target={"_blank"} href={`https://ipfs.io/ipfs/${noteData.ipfsHash}`}>
          view on IPFS
        </a>
      )}
      <style jsx>
        {`
          .col {
            flex: 1;
            flex-direction: column;
          }
        `}
      </style>
    </div>
  );
}
