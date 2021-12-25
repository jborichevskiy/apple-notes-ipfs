import { SWRConfig } from "swr";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        errorRetryInterval: 10000,
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}

export default MyApp;
