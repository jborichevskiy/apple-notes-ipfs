export default function Home() {
  return (
    <>
      <html>
        <div className="row center middle">
          <span className="heading">notes.site | </span>
          <span className="secondary">coming soon</span>
        </div>
        <div className="footer"></div>
        <footer id="footer">
          <div className="content-wrap center">
            <a href="https://github.com/jborichevskiy/apple-notes-ipfs">
              github
            </a>
            <span className="seperator">·</span>
            <a href="https://t.me/+sXjvydphLF5mZGZj">telegram</a>
          </div>
        </footer>
        <style>{`
        #page-container {
          position: relative;
          min-height: 100vh;
        }
        
        #content-wrap {
          padding-bottom: 2rem;    /* Footer height */
        }
        
        #footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 2rem;            /* Footer height */
        }
        
        .seperator {
          margin: 0 0.5rem;
        }
        .footer {
          position: absolute;
          bottom: 
        }
        .center {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .middle {
          align-items: center;
          height: 100%;
          padding-bottom: 5rem;
        }
        .row {
          display: flex;
          flex-direction: row;
        }
        .col {
          display: flex;
          flex-direction: column;
        }
        .heading {
          font-size: 24px;
        }
        a {
          font-size: 12px;
          color: #dca10d;
        } 
        .secondary {
          color: #dca10d;
          margin-left: 6px;
          margin-top: 2px;
        }
      `}</style>
      </html>
    </>
  );
}
