import logo from "@/assets/images/logo.svg";
import backgroundImage from "@/assets/images/background.jpg";
import "@/styles/App.css";
import {
  Box,
  Button,
  Text,
} from "@chakra-ui/react";
import KakaoLogin from "@/components/common/KakaoLogin";
import { useEffect } from "react";
// import Footer from '@/components/layout/Footer'

function Homepage() {
  // Dark mode removed - only using light mode now

  useEffect(() => {
    const viewportmeta = document.querySelector('meta[name="viewport"]');
    if (viewportmeta) {
      const orig = viewportmeta.getAttribute("content");
      viewportmeta.setAttribute(
        "content",
        "width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0"
      );
      setTimeout(() => {
        viewportmeta.setAttribute("content", orig);
      }, 100);
    }
  }, []);

  return (
    <div
      className="App"
      style={{
        maxWidth: "1200px",
        margin: "0 auto", // Horizontal centering
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <header className="App-header" style={{ width: "100%" }}>
        {/* <img src={backgroundImage} className="App-logo" alt="logo" /> */}
        <img
          src={backgroundImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            objectPosiion: "top",
            marginTop: "60px",
          }}
          alt="background image"
        />
        {/* <Text
		  bgGradient='linear(to-l, #7928CA, #FF0080)'
		  bgClip='text'
		  fontSize='6xl'
		  fontWeight='extrabold'
		>
		  Sehan IB
		</Text> */}
        {/* <p>
          Adit <code>src/App.js</code> and save to reload.
        </p>
		<Box mb={4} bg={bg} color={color}>
	          this box's style will change based on the color mode.
	    </Box>
	    <KakaoLogin />

		<Button onClick={toggleColorMode}>
	  		Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
	  	</Button> */}
        {/* 
	  	<a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
      {/* <Footer /> */}
    </div>
  );
}

export default Homepage;
