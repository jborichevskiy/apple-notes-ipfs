import PostsLayout from "@components/posts/PostsLayout";

export default function Me() {
  return (
    <>
      <html>
        <div className="row center middle">
          <span className="heading">notes.site | </span>
          <span className="secondary">coming soon</span>
        </div>
        <div>
          <div className="row center footer">
            <a href="https://github.com/jborichevskiy/apple-notes-ipfs">
              github
            </a>
            <span className="seperator">·</span>
            <a href="https://t.me/+sXjvydphLF5mZGZj">telegram</a>
          </div>
        </div>
        <style>{`
        .seperator {
          margin: 0 0.5rem;
        }
        .footer {
          height: 5vh;
        }
        .center {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .middle {
          align-items: center;
          height: 95vh;
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
          margin-top: 3px;
        }
        p.p1 {
          font-size: 32px;
        }
        p.p2 {
          font-size: 24px;
        }
        p.p3 {
          font-size: 16px;
        }
        p.p4 {
          font-size: 16px;
          font-family: monospace;
        }
        p.p5 {
          font-size: 16px;
        }
        p.p6 {
          font-size: 16px;
        }
        ul.ul1 {
          list-style-type: disc;
        }
        li.li3 {
          font-size: 16px;
        }
      `}</style>
      </html>
    </>
  );
}
