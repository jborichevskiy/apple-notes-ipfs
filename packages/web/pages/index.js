import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [noteData, setNoteData] = useState({});
  const [pageId, setPageId] = useState("");

  async function handleCheckStatus() {
    const id = url.split("/notes/")[1].split("#")[0];
    setPageId(id);

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
        <div className="col">
          <a target={"_blank"} href={`/page?id=${pageId}`}>
            view page
          </a>
          <a
            target={"_blank"}
            href={`https://ipfs.io/ipfs/${noteData.ipfsHash}`}
          >
            view on IPFS (takes a while to index)
          </a>
        </div>
      )}
      <style jsx>
        {`
          .col {
            display: flex;
            flex-direction: column;
          }
        `}
      </style>
    </div>
  );
}
