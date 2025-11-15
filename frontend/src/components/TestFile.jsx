import React, { useState, useEffect, useRef } from "react";
import { FiClock } from "react-icons/fi";
import { Flex, VStack } from "@chakra-ui/react";
import "../index.css";
import instance from "../apis/AxiosInterceptor";

const initialHomeworkItems = [
  {
    name: "물리",
    startDay: "2024-09-21",
    endDay: "2024-10-17",
    borderColor: "#FF7783",
  },
  {
    name: "수학",
    startDay: "2024-09-23",
    endDay: "2024-11-01",
    borderColor: "#8FD8A0",
  },
  {
    name: "화학",
    startDay: "2024-09-24",
    endDay: "2024-11-05",
    borderColor: "#45BFFF",
  },
];

function HomeworkButton() {
  const [homeworkItems, setHomeworkItems] = useState([]);
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const current_kst = new Date(utc + 9 * 60 * 60000);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchHomeworkItemsList();
  }, []);

  const fetchHomeworkItemsList = async () => {
    try {
      const response = await instance.get("/api/students/me/homework/master", {
        params: { status: "pending" },
      });
      console.log("received pending homework list response:", response.data);

      setHomeworkItems(response.data);
    } catch (error) {
      console.error("Error fetching pending homework list:", error);
    }
  };

  return (
    <Flex
      direction="column"
      width="100%"
      height="100%"
      ref={scrollRef}
      overflowY="auto"
      h="300px"
      css={{
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          width: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "gray.300",
          borderRadius: "24px",
        },
      }}
    >
      <VStack spacing={2} align="stretch">
        {homeworkItems.map((homeworkItem) => {
          // const currentMonth = currentDate.getMonth() + 1;
          // const currentDay = currentDate.getDate();
          const dueDateObj = new Date(homeworkItem.dueDate);
          const daysLeft = Math.ceil(
            (dueDateObj - current_kst) / (1000 * 60 * 60 * 24)
          );

          // Update the button's border color dynamically based on the `borderColor` in each homework item
          const styles = {
            button: {
              borderLeftWidth: "10px",
              borderLeftColor: homeworkItem.fg_color, // Dynamic border color
              padding: "2.6% 10.4% 2.6% 4.4%",
              margin: "1.5% 0px",
              borderRadius: "10px",
              boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.1)",
              display: "inline-block",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
              height: "100%",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            },
            subject: {
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#fff",
              marginBottom: "2.5%",
              marginTop: "2.5%",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxWidth: "15rem",
            },
            dueDate: {
              fontSize: "0.9rem",
              color: "#fff",
              marginTop: "5px",
              marginLeft: "5px",
              // textOverflow: 'ellipsis',
              // whiteSpace: 'nowrap',
              // overflow: 'hidden',
            },
            daysLeft: {
              fontSize: "1.5rem",
              color: daysLeft > 1 ? "#84e1bc" : "#d9534f", // Green if days left, red if due today
              fontFamily: "Noto Sans KR Bold",
              // marginRight: '30px',
              // marginTop: '20px',
              // marginLeft: 'auto',
              // boxSizing: 'border-box',
              // paddingLeft: "70%",
              // marginLeft: '9rem',
              // marginLeft: '9vw',
              // width: '100%',
              // textOverflow: 'ellipsis',
              // whiteSpace: 'nowrap',
              // overflow: 'hidden',
            },
          };

          return (
            <button style={styles.button} key={homeworkItem.id}>
              <Flex justifyContent="flex-start" alignItems="center">
                <Flex>
                  <div style={styles.daysLeft}>D-{daysLeft}</div>
                </Flex>
                <Flex direction="column" paddingLeft="15px">
                  <div style={styles.subject}>
                    {homeworkItem.subject_name} - {homeworkItem.title}
                  </div>
                  <Flex>
                    <FiClock style={{ marginTop: "4px" }} />
                    <div style={styles.dueDate}>{new Date(homeworkItem.dueDate).toLocaleDateString()}</div>
                  </Flex>
                </Flex>
                
              </Flex>
            </button>
          );
        })}
      </VStack>
    </Flex>
  );
}

export default HomeworkButton;
