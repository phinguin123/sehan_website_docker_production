// import "./styles.css";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import styled from "styled-components";
import Pie from "./PieChart";
import "../index.css";
import { useMediaQuery } from "react-responsive";
import instance from "../apis/AxiosInterceptor";

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const Wrapper = styled.div`
  display: flex;
width: 100%;
  margin-top: 2.5%;
  margin-bottom: 2%;
  color: #999;
  aria-label: "MotionCard";
  align-items: center;
  justify-content: center;
`;

const SubjectName = styled.div`
  font-family: "Noto Sans KR SemiBold";
  font-size: 1.5rem;
  font-weight: 900;
  color: #333;
`;

const MotionCard = styled(motion.div)`
  border-radius: 50%;
  //box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
  width: 100%;
  height: 16rem;
  font-size: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 255, 255, 0);
  aria-label: "MotionCard";
`;

const chartContainer = styled.div`
  width: 100%; /* Take up full width of the parent container */
  height: 100%;
  position: relative;
`;

const Buttons = styled.div`
  display: flex;
`;

const MotionButton = styled(motion.button)`
  margin: 0.6rem;
  background-color: white;
  border: transparent;
  padding: 0.4rem;
  height: 2.7rem;
  width: 2.7rem;
  border-radius: 50%;
  cursor: pointer;
`;

const PieWrapper = styled.div`
  width: 100%;
  height: 100%;
  margin: 0 auto; /* Center the chart */
  background: rgba(255, 0, 0, 0);
`;

const initialItems = [
  {
    percent: 60,
    name: "subject2",
    fgColor: "#77E900",
    bgColor: "#1B330C",
    gradient: "#E0FE52",
  },
  {
    percent: 90,
    name: "subject1",
    fgColor: "#E64B85",
    bgColor: "#380C10",
    gradient: "#E20118",
  },
  {
    percent: 40,
    name: "subject3",
    fgColor: "#63D6F8",
    bgColor: "#112B33",
    gradient: "#75FBB0",
  },
];

export default function SubjectCarousel({ customParam }) {
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0]);
  const [items, setItems] = useState([]);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [itemsLength, setItemsLength] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  console.log("isMobile:", isMobile);

  useEffect(() => {
    console.log("fetchItemsList");
    fetchItemsList();
  }, []);

  const fetchItemsList = async () => {
    const url = customParam
      ? `/api/students/${customParam}/subjects/averages` // when parent component passes child id
      : "/api/students/me/subjects/averages";

    try {
      const response = await instance.get(url, { withCredentials: true });
      console.log("Subject Carousel values:", response.data);

      setItems(response.data);
      setItemsLength(response.data.length > 3 ? 3 : response.data.length);
    } catch (error) {
      console.error("Error fetching items list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // we want the scope to be always to be in the scope of the array so that the carousel is endless
  const indexInArrayScope =
    ((activeIndex % items.length) + items.length) % items.length;

  // so that the carousel is endless, we need to repeat the items twice
  // then, we slice the the array so that we only have 3 items visible at the same time
  const visibleItems = isMobile
    ? [items[indexInArrayScope]]
    : [...items, ...items].slice(
        indexInArrayScope,
        indexInArrayScope + itemsLength
      );
  const handleClick = (newDirection) => {
    setActiveIndex((prevIndex) => [prevIndex[0] + newDirection, newDirection]);
  };

  return (
    <MainWrapper>
      {isLoading || items.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <Wrapper>
          {/*AnimatePresence is necessary to show the items after they are deleted because only max. 3 are shown*/}
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleItems.map(
              ({ percent, subject_name, fg_color, bg_color, gradient }) => {
                // The layout prop makes the elements change its position as soon as a new one is added
                // The key tells framer-motion that the elements changed its position
                return (
                  <MotionCard
                    key={subject_name}
                    layout
                    custom={{
                      direction,
                      position: () => {
                        if (isMobile) return "center";
                        if (subject_name === visibleItems[0].subject_name) {
                          return "left";
                        } else if (
                          subject_name === visibleItems[1].subject_name
                        ) {
                          return "center";
                        } else {
                          return "right";
                        }
                      },
                    }}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 1 }}
                  >
                    <PieWrapper style={{ opacity: 1 }}>
                      <Pie
                        percent_value={percent}
                        fgColor={fg_color}
                        bgColor={bg_color}
                        gradientColor={gradient}
                      />
                    </PieWrapper>
                    <SubjectName style={{color: "white"}}>{subject_name}</SubjectName>
                  </MotionCard>
                );
              }
            )}
          </AnimatePresence>
        </Wrapper>
      )}
      {!isLoading && items.length > 0 && (
        <Buttons>
          <MotionButton
            whileTap={{ scale: 0.8 }}
            onClick={() => handleClick(-1)}
            style={{color: "black"}}
          >
            ◀︎
          </MotionButton>
          <MotionButton
            whileTap={{ scale: 0.8 }}
            onClick={() => handleClick(1)}
            style={{color: "black"}}
          >
            ▶︎
          </MotionButton>
        </Buttons>
      )}
    </MainWrapper>
  );
}

const variants = {
  enter: ({ direction }) => {
    return { scale: 0.2, x: direction < 1 ? 50 : -50, opacity: 0 };
  },
  center: ({ position, direction }) => {
    return {
      scale: position() === "center" ? 1 : 0.7,
      x: 0,
      zIndex: getZIndex({ position, direction }),
      opacity: 1,
    };
  },
  exit: ({ direction }) => {
    return { scale: 0.2, x: direction < 1 ? -50 : 50, opacity: 0 };
  },
};

function getZIndex({ position, direction }) {
  const indexes = {
    left: direction > 0 ? 2 : 1,
    center: 3,
    right: direction > 0 ? 1 : 2,
  };
  return indexes[position()];
}
