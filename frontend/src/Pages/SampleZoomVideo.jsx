// import { React } from 'react'
// import video from '../../flask_server/sehan_test_video.mp4'
// import '../Styles/App.css'


// function SampleZoomVideo(){
//   return (
//     <div className="App">
//     <p>hello</p>
//     <video width="100%" minHeight="100vh" controls >
//     <source src={video} type="video/mp4"/>
//    </video>
//     </div>
//   );
// }


// export default SampleZoomVideo;

import * as React from "react"
import '../Styles/App.css'

import { Progress } from "@/components/ui/progress"
import '../index.css'

export default function SampleZoomVideo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (<div className="App" style={{marginTop:'100px', marginLeft:'400px', width:'200px', minHeight: "1000px",
    display: "flex",
    flexDirection: "column",
    gap: "20px", // Adds spacing between elements
    }} >
        <h1 className="text-3xl font-bold underline">
          Hello world!
        </h1>
        <Progress value={92} style={{
          width: "100%", // Ensures the progress bar takes up the full width of the container
          height: "100px", // Set a specific height for visibility
          backgroundColor: "rgba(24, 24, 27, 0.2)", // Optional: background color for the progress track
        }}  />
        </div>)
}
