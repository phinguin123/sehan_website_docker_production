import React, { useState, useEffect, useRef } from "react";
import {
  Box, // Import Box from Chakra UI for the inner container
  Text,
  Grid,
  GridItem,
  Container,
  Flex,
  ChakraProvider,
  extendTheme,
} from "@chakra-ui/react";
import styled from "styled-components";
import SubjectCarousel from "@/components/common/SubjectCarousel";
import "@/styles/index.css";
import TimeTable from "@/components/common/TimeTable";
import HomeworkButton from "@/components/common/TestFile";
import "@/styles/media.css";
import SubmissionRate from "@/components/common/SubmissionRate";
import Ranking from "@/components/common/Ranking";
import instance from "@/apis/axiosInstance";
import LiquidGlass from "@/components/common/LiquidGlass";
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

const baseCardMinH = { base: "260px", md: "240px", lg: "260px" };
const cardBasePadding = { base: "16px", md: "20px" };
const glassStyle = { width: "100%", height: "100%", position: "absolute", inset: 0 };

const EmptyState = ({ title = "데이터가 없습니다", description }) => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    gap={2}
    textAlign="center"
    color="rgba(255,255,255,0.85)"
    minH="140px"
  >
    <Text fontWeight="800">{title}</Text>
    {description ? <Text fontSize="0.95rem">{description}</Text> : null}
  </Flex>
);

const StudentGradesPage = () => {
  const [submissionRateValue, setSubmissionRateValue] = useState(null);
  const [attendanceRateValue, setAttendanceRateValue] = useState(null);
  const [rankingData, setRankingData] = useState([]);
  const [fetchState, setFetchState] = useState({
    submission: "idle",
    attendance: "idle",
    ranking: "idle",
  });
  const [fetchError, setFetchError] = useState({
    submission: "",
    attendance: "",
    ranking: "",
  });
  const isMountedRef = useRef(true);
  const parentRef = useRef(null);

  // liquid glass effect parameters
  const [displacementScale, setDisplacementScale] = useState(100)
  const [blurAmount, setBlurAmount] = useState(0.5)
  const [saturation, setSaturation] = useState(140)
  const [aberrationIntensity, setAberrationIntensity] = useState(2)
  const [elasticity, setElasticity] = useState(0)
  const [cornerRadius, setCornerRadius] = useState(32)

  const safeSetState = (setter) => {
    if (isMountedRef.current) {
      setter();
    }
  };

  const formatError = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    "데이터를 불러오지 못했습니다.";

  const handleFetchError = (key, error, onError) => {
    console.error(`Error fetching ${key}:`, error);
    safeSetState(() => {
      setFetchState((prev) => ({ ...prev, [key]: "error" }));
      setFetchError((prev) => ({ ...prev, [key]: formatError(error) }));
    });
    onError?.();
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchSubmissionRate(),
        fetchAttendanceRate(),
        fetchRankingData(),
      ]);
    };

    load();
  }, []);

  const fetchRankingData = async () => {
    safeSetState(() =>
      setFetchState((prev) => ({ ...prev, ranking: "loading" }))
    );
    try {
      const response = await instance.get("/get_percentiles");
      const payload = Array.isArray(response.data) ? response.data : [];

      safeSetState(() => {
        setRankingData(payload);
        setFetchState((prev) => ({
          ...prev,
          ranking: payload.length ? "success" : "empty",
        }));
        setFetchError((prev) => ({ ...prev, ranking: "" }));
      });
    } catch (error) {
      handleFetchError("ranking", error, () => setRankingData([]));
    }
  };

  const fetchSubmissionRate = async () => {
    safeSetState(() =>
      setFetchState((prev) => ({ ...prev, submission: "loading" }))
    );
    try {
      const response = await instance.get("/api/students/me/homework/rate");
      const value =
        typeof response.data === "number" ? response.data : null;

      safeSetState(() => {
        setSubmissionRateValue(value);
        setFetchState((prev) => ({
          ...prev,
          submission: value === null ? "empty" : "success",
        }));
        setFetchError((prev) => ({ ...prev, submission: "" }));
      });
    } catch (error) {
      handleFetchError("submission", error, () => setSubmissionRateValue(null));
    }
  };

  const fetchAttendanceRate = async () => {
    safeSetState(() =>
      setFetchState((prev) => ({ ...prev, attendance: "loading" }))
    );
    try {
      const response = await instance.get("/api/students/me/attendance/rate");
      const value =
        typeof response.data === "number" ? response.data : null;

      safeSetState(() => {
        setAttendanceRateValue(value);
        setFetchState((prev) => ({
          ...prev,
          attendance: value === null ? "empty" : "success",
        }));
        setFetchError((prev) => ({ ...prev, attendance: "" }));
      });
    } catch (error) {
      handleFetchError("attendance", error, () => setAttendanceRateValue(null));
    }
  };

  return (
    <>
      <div>
        <ChakraProvider theme={theme}>
          <Flex
            color="black"
            align="center"
            justify="center"
            direction="column"
            minH="100vh"
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
              px={{ base: 4, md: 6 }}
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
              alignItems="stretch"
              justifyItems="stretch"
              gridAutoRows="minmax(260px, auto)"
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
                minH={baseCardMinH}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    // This Box provides padding and aligns content inside the glass
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                    minH={baseCardMinH}
                    gap={3}
                    position="relative"
                    zIndex={1}
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
                minH={baseCardMinH}
                ref={parentRef}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    width="100%"
                    height="100%"
                    minH={baseCardMinH}
                    gap={3}
                    position="relative"
                    zIndex={1}
                  >
                    <ContainerHeading>순위</ContainerHeading>
                    {fetchState.ranking === "loading" ? (
                      <EmptyState
                        title="불러오는 중입니다"
                        description="순위 데이터를 준비하고 있어요."
                      />
                    ) : fetchState.ranking === "error" ? (
                      <EmptyState
                        title="순위를 불러오지 못했어요"
                        description={fetchError.ranking}
                      />
                    ) : rankingData && rankingData.length ? (
                      <Ranking
                        studentData={rankingData}
                        style={{ height: "100%", width: "100%" }}
                      />
                    ) : (
                      <EmptyState
                        title="순위 데이터가 없어요"
                        description="성적이 등록되면 자동으로 표시됩니다."
                      />
                    )}
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
                minH={baseCardMinH}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                    minH={baseCardMinH}
                    gap={4}
                    position="relative"
                    zIndex={1}
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
                minH={baseCardMinH}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    width="100%"
                    minH={baseCardMinH}
                    gap={3}
                    position="relative"
                    zIndex={1}
                  >
                    <ContainerHeading>숙제 제출률 </ContainerHeading>
                    {fetchState.submission === "loading" ? (
                      <EmptyState
                        title="불러오는 중입니다"
                        description="제출률을 준비하고 있어요."
                      />
                    ) : fetchState.submission === "error" ? (
                      <EmptyState
                        title="제출률을 불러오지 못했어요"
                        description={fetchError.submission}
                      />
                    ) : submissionRateValue === null || submissionRateValue === undefined ? (
                      <EmptyState
                        title="제출률 데이터가 없어요"
                        description="숙제가 등록되면 제출률이 표시됩니다."
                      />
                    ) : (
                      <SubmissionRate submissionRate={submissionRateValue} />
                    )}
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
                minH={baseCardMinH}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    height="100%"
                    width="100%"
                    minH={baseCardMinH}
                    gap={4}
                    position="relative"
                    zIndex={1}
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
                minH={baseCardMinH}
              >
                <LiquidGlass
                  cornerRadius={cornerRadius}
                  displacementScale={displacementScale}
                  blurAmount={blurAmount}
                  saturation={saturation}
                  aberrationIntensity={aberrationIntensity}
                  elasticity={elasticity}
                  style={glassStyle}
                >
                  <Box
                    padding={cardBasePadding}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    width="100%"
                    minH={baseCardMinH}
                    gap={3}
                    position="relative"
                    zIndex={1}
                  >
                    <ContainerHeading>출석률</ContainerHeading>
                    {fetchState.attendance === "loading" ? (
                      <EmptyState
                        title="불러오는 중입니다"
                        description="출석률을 준비하고 있어요."
                      />
                    ) : fetchState.attendance === "error" ? (
                      <EmptyState
                        title="출석률을 불러오지 못했어요"
                        description={fetchError.attendance}
                      />
                    ) : attendanceRateValue === null || attendanceRateValue === undefined ? (
                      <EmptyState
                        title="출석률 데이터가 없어요"
                        description="수업이 시작되면 출석률이 표시됩니다."
                      />
                    ) : (
                      <SubmissionRate submissionRate={attendanceRateValue} />
                    )}
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
