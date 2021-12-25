import { GetServerSideProps } from "next";
import { Feed } from "feed";
import moment from "moment";
import useSwr from "swr";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const postFetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.error);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

const buildFeed = (subdomain, items, account) => {
  const hostUrl = `http://${subdomain}.notes.site`;
  const feed = new Feed({
    id: hostUrl,
    link: hostUrl,
    title: "${subdomain}'s notes",
    description: "Some description for your website.",
    copyright: "",
    updated: moment(items[0].date, "YYYY-MM-DD").toDate(),
    author: {
      name: account.name,
      link: hostUrl,
    },
  });

  items.forEach((post) => {
    console.log({ post });
    feed.addItem({
      title: post.title,
      link: `${hostUrl}/posts/${post.slug}`,
      // description: post.summary,
      date: moment(post.createdAt, "YYYY-MM-DD").toDate(),
    });
  });

  return feed;
};

export const getServerSideProps = async (context) => {
  if (context && context.res) {
    const { res } = context;
    const subdomain = context.req.headers.host.split(".")[0] || "";

    const account = await prisma.account.findFirst({
      where: {
        username: subdomain,
      },
    });

    if (!account) {
      return res.status(404).json({ message: "account not found" });
    }

    // NOTE: This should be a function or imported method that makes a call to the backend.
    const posts = await prisma.post.findMany({
      where: {
        // visible: true,
        accountId: account.id,
      },
    });

    const feed = buildFeed(subdomain, posts, account);
    res.setHeader("content-type", "text/xml");
    res.write(feed.rss2()); // NOTE: You can also use feed.atom1() or feed.json1() for other feed formats
    res.end();
  }

  return {
    props: {},
  };
};

const RssPage = () => null;

export default RssPage;
