import React, { useState, useEffect, useRef } from "react";
import {
  Box, // Import Box from Chakra UI for the inner container
  Text,
  Heading,
  Center,
  Grid,
  GridItem,
  Container,
  Flex,
  ChakraProvider,
  extendTheme,
} from "@chakra-ui/react";
import styled from "styled-components";
import SubjectCarousel from "../components/SubjectCarousel";
import * as d3 from "d3";
import "../index.css";
import TimeTable from "../components/TimeTable";
import HomeworkButton from "../components/TestFile";
import "../Styles/media.css";
import SubmissionRate from "../components/SubmissionRate";
import Ranking from "../components/Ranking";
import instance from "../apis/AxiosInterceptor";
// Make sure this LiquidGlass import points to the file you provided
import LiquidGlass from "liquid-glass-react"; // Assuming this is your component path
import background_image from "@/assets/brand/mountain3_background.jpg";


const theme = extendTheme({
  breakpoints: {
    sm: "30em", // 480px
    md: "49em", // 768px
    lg: "62em", // 992px
    ipad: "64em", // 1024px
    mac: "90em", // 1440px
    xl: "95em", // 1536px
    "1.5xl": "108em", // 1728px custom breakpoint
    "2xl": "120em", // 1920px
  },
});

const ContainerHeading = styled.div`
  font-family: "Noto Sans KR Bold";
  font-weight: 900;
  font-size: 1.7rem;
  color: #ffffff; /* Keep this as white to show through the glass */
`;

const studentData = [];

const StudentGradesPage = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [submissionRateValue, setSubmissionRateValue] = useState(0);
  const [attendanceRateValue, setAttendanceRateValue] = useState(0);
  const [rankingData, setRankingData] = useState(studentData);
  const parentRef = useRef(null);
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 });
  
  // liquid glass effect parameters
  const [displacementScale, setDisplacementScale] = useState(100)
  const [blurAmount, setBlurAmount] = useState(0.5)
  const [saturation, setSaturation] = useState(140)
  const [aberrationIntensity, setAberrationIntensity] = useState(2)
  const [elasticity, setElasticity] = useState(0)
  const [cornerRadius, setCornerRadius] = useState(32)

  useEffect(() => {
    const updateParentSize = () => {
      if (parentRef.current) {
        setParentSize({
          width: parentRef.current.offsetWidth,
          height: parentRef.current.offsetHeight,
        });
      }
    };

    updateParentSize(); // Set initial size

    // Add event listener for window resize to update dimensions
    window.addEventListener('resize', updateParentSize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('resize', updateParentSize);
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    fetchSubmissionRate();
    fetchAttendanceRate();
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    try {
      const response = await instance.get("/get_percentiles");
      console.log("received ranking response:", response.data);
      setRankingData(response.data);
    } catch (error) {
      console.error("Error fetching ranking rate:", error);
    }
  };

  const fetchSubmissionRate = async () => {
    try {
      const response = await instance.get("/api/student/homeworkRate");
      console.log("received homework rate response:", response.data);
      setSubmissionRateValue(response.data);
    } catch (error) {
      console.error("Error fetching homework rate:", error);
    }
  };

  const fetchAttendanceRate = async () => {
    try {
      const response = await instance.get("/api/student/attendanceRate");
      console.log("received attendance rate response:", response.data);
      setAttendanceRateValue(response.data);
    } catch (error) {
      console.error("Error fetching attendance rate:", error);
    }
  };

  const generateData = (value, length = 5) =>
    d3.range(length).map((item, idx) => ({
      date: idx,
      value:
        value === null || value === undefined ? Math.random() * 100 : value,
    }));

  const [data, setData] = useState(generateData());
  const changeData = () => {
    setData(generateData());
  };

  const rootElement = document.documentElement;
  const computedStyle = window.getComputedStyle(rootElement);

  console.log("font size", computedStyle.fontSize);

  return (
    <>
      <div>
        <ChakraProvider theme={theme}>
          <Flex
            color="black"
            align="center"
            justify="center"
            direction="column"
            minH="100%"
            width="100%"
            marginTop="4rem"
            backgroundAttachment="fixed"
            backgroundImage={`url(${background_image})`}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
          >
            <Container
              // Set responsive max-width for the container
              maxW={{ base: "100%", md: "container.lg", xl: "container.xl", "2xl": "container.2xl" }}
              p={0}
              marginLeft={{md:"0rem", lg:"0rem", xl: "2rem", "2xl":"5rem"}}
              // backgroundAttachment="fixed"
              // backgroundImage={`url(${background_image})`}
            >
            <Grid
              // templateRows="repeat(4, minmax(220px,1fr))"
              templateRows={{
                base: "repeat(10, minmax(200px, 1fr))",
                md: "repeat(6, minmax(150px, 1fr))",
                lg: "repeat(6, minmax(190px, 1fr))",
                ipad: "repeat(6, minmax(180px, 1fr))",
                mac: "repeat(4, minmax(180px, 1fr))",
                xl: "repeat(4, minmax(190, 1fr))",
                "2xl": "repeat(4, minmax(220px, 1fr))",
              }}
              templateColumns={{
                base: "minmax(220px, 1fr)",
                md: "repeat(4, minmax(150px, 1fr))",
                lg: "repeat(4, minmax(190px, 1fr))",
                ipad: "repeat(4, minmax(180px, 1fr))",
                mac: "repeat(6, minmax(180px, 1fr))",
                xl: "repeat(6, minmax(190px, 1fr))",
                "2xl": "repeat(6, minmax(220px, 1fr))",
              }}
              gap={4}
              p={10}
              width="100%"
              // justifyItems="center" // 👈 center items inside their cells
              // bgImage="url('/assets/brand/mountain2_background.jpg')"
              // bgSize="cover"
              // bgAttachment="fixed"
            >
              {/* Grid Item 1: 주간 평균 숙제 점수 */}
              <GridItem
                rowSpan={2}
                colSpan={{ base: 6, md: 4 }}
                position="relative"
                width="100%"
                height="100%"
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    // This Box provides padding and aligns content inside the glass
                    padding="4px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                  >
                    <ContainerHeading>주간 평균 숙제 점수</ContainerHeading>
                    <SubjectCarousel />
                  </Box>
                </LiquidGlass>
              </GridItem>

              {/* Grid Item 2: 순위 */}
              {/* Grid Item 2: 순위 */}
              
              <GridItem
                rowSpan={2}
                colSpan={{ base: 6, md: 2 }}
                position="relative"
                width="100%"
                height="100%"
                ref={parentRef}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    padding="4px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    width="100%"
                    height="100%"
                  >
                    <ContainerHeading>순위</ContainerHeading>
                    <Ranking studentData={rankingData} style={{height: "100%", width: "100%"}}/>
                  </Box>
                </LiquidGlass>
              </GridItem>
             

              {/* Grid Item 3: 해야 할 숙제 */}
              
              <GridItem
                rowSpan={2}
                colSpan={{ base: 6, md: 2 }}
                position="relative"
                width="100%"
                height="100%"
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    padding="24px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                  >
                    <ContainerHeading>해야 할 숙제</ContainerHeading>
                    <Flex marginTop="1.5rem" style={{ width: "100%", height: "100%" }}>
                      <HomeworkButton subject="Math" dueDate="2024-09-30" />
                    </Flex>
                  </Box>
                </LiquidGlass>
              </GridItem>
             

              {/* Grid Item 4: 숙제 제출률 */}
              
              <GridItem
                rowSpan={1}
                colSpan={{ base: 6, md: 2 }}
                position="relative"
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
                height="100%"
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    padding="24px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    width="100%"
                  >
                    <ContainerHeading>숙제 제출률 </ContainerHeading>
                    <SubmissionRate submissionRate={submissionRateValue} />
                  </Box>
                </LiquidGlass>
              </GridItem>
             

              {/* Grid Item 5: 오늘 수업 */}
              
              <GridItem
                rowSpan={2}
                colSpan={{ base: 6, md: 2 }}
                position="relative"
                width="100%"
                height="100%"
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    padding="24px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                  >
                    <ContainerHeading>오늘 수업</ContainerHeading>
                    <TimeTable />
                  </Box>
                </LiquidGlass>
              </GridItem>
             

              {/* Grid Item 6: 출석률 */}
              
              <GridItem
                rowSpan={1}
                colSpan={{ base: 6, md: 2 }}
                position="relative"
                width="100%"
                height="100%"
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={{ width: "100%", height: "100%", position: "absolute", top: "50%", left: "50%" }}
                >
                  <Box
                    padding="24px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    width="100%"
                  >
                    <ContainerHeading>출석률</ContainerHeading>
                    <SubmissionRate submissionRate={attendanceRateValue} />
                  </Box>
                </LiquidGlass>
              </GridItem>
             
            </Grid>
             </Container>
          </Flex>
        </ChakraProvider>
      </div>
    </>
  );
};

export default StudentGradesPage;
