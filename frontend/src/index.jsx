import * as React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./Pages/App";
import reportWebVitals from "./reportWebVitals";

// 1. import `ChakraProvider` component
import { ColorModeScript, ChakraProvider } from "@chakra-ui/react";
import theme from "./theme_test";
import { Provider } from "react-redux";
import store from "./store";
import "./scss/style.scss";

/*
const colors = {
	  brand: {
		      900: '#1a365d',
		      800: '#153e75',
		      700: '#2a69ac',
		    },
}
*/

//const theme = extendTheme({ colors })

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  //<React.SrictMode>
  <ChakraProvider theme={theme} cssVarsRoot="body">
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <Provider store={store}>
      <App />
    </Provider>
  </ChakraProvider>
  //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
