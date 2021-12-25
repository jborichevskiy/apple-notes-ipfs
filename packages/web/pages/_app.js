import { SWRConfig } from "swr";
import "../styles/globals.css";

const fetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.message);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        errorRetryInterval: 10000,
        fetcher,
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}

export default MyApp;
