import styles from "../styles/Home.module.css";
import { useState } from "react";
import Link from "next/link";

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
    <div className={`${styles.container} doc col`}>
      <div className="section">
        <h2 className="header">notes.site</h2>
        <Link href="/page?id=0df3O0NErlEnfucDOuPC5W8iQ">
          <a>how to use</a>
        </Link>
      </div>
      <input
        onChange={(e) => setUrl(e.target.value)}
        placeholder="iCloud link"
      ></input>
      <button disabled={!url} onClick={handleSubmit}>
        Submit
      </button>
      <button disabled={!url} onClick={handleCheckStatus}>
        Check Status
      </button>
      {noteData && noteData.ipfsHash && (
        <div className="col">
          <Link href={`/page?id=${pageId}`}>
            <a>view page</a>
          </Link>
          <Link href={`/page?id=${pageId}`}>
            <a>view on IPFS (takes a while to index)</a>
          </Link>
        </div>
      )}
      <style jsx>
        {`
          .header {
            margin-bottom: 0;
          }
          .section {
            padding-bottom: 1rem;
          }
          .doc {
            padding: 1rem;
          }
          .col {
            display: flex;
            flex-direction: column;
          }
        `}
      </style>
    </div>
  );
}
