// import React from 'react'
// import {
//     IconButton,
//     Box,
//     CloseButton,
//     Flex,
//     Icon,
//     useColorModeValue,
//     Text,
//     Drawer,
//     DrawerContent,
//     useDisclosure,
//   } from '@chakra-ui/react'

//   const ClassItems = [
//     { name: '물리 11학년 HL', lecturerName: '조연준 강사님', startTime: '09:00', endTime: '10:00', borderColor: '#FF7783' },
//     { name: '수학 12학년 SL', lecturerName: '이엘림 강사님', startTime: '13:00', endTime: '14:00', borderColor: '#8FD8A0' },
//     { name: '화학 11학년 SL', lecturerName: '마재훈 강사님', startTime: '16:00', endTime: '17:00', borderColor: '#45BFFF' },
//     { name: '영어 10학년 HL', lecturerName: '김영희 강사님', startTime: '10:00', endTime: '11:00', borderColor: '#FFA500' },
//     { name: '생물 12학년 HL', lecturerName: '박철수 강사님', startTime: '14:00', endTime: '15:00', borderColor: '#8A2BE2' },
//     { name: '경제 11학년 SL', lecturerName: '이지은 강사님', startTime: '11:00', endTime: '12:00', borderColor: '#20B2AA' },
//     { name: '역사 10학년 SL', lecturerName: '정민우 강사님', startTime: '15:00', endTime: '16:00', borderColor: '#FF69B4' },
//     { name: '심리 12학년 HL', lecturerName: '송혜교 강사님', startTime: '12:00', endTime: '13:00', borderColor: '#32CD32' },
//     { name: '미술 11학년 SL', lecturerName: '홍길동 강사님', startTime: '17:00', endTime: '18:00', borderColor: '#FF4500' },
//     { name: '체육 10학년 SL', lecturerName: '강동원 강사님', startTime: '18:00', endTime: '19:00', borderColor: '#1E90FF' },
//     { name: '음악 12학년 HL', lecturerName: '이순신 강사님', startTime: '19:00', endTime: '20:00', borderColor: '#FF1493' },
//     { name: '지리 11학년 SL', lecturerName: '유관순 강사님', startTime: '20:00', endTime: '21:00', borderColor: '#00CED1' },
//     { name: '컴퓨터 10학년 HL', lecturerName: '안중근 강사님', startTime: '21:00', endTime: '22:00', borderColor: '#9400D3' }
//   ];

// function TimeTable(){
//     return (
//       // <Box>
//       // {ClassItems.map((class) => (
//       //   <Box>
//       //     <Flex align="center">{class.name}</Flex>
//       //   </Box>
//       // ))}
//       // </Box>
//       <Box marginTop='2.8rem'>
//       {ClassItems.map((classItem) => (
//         <Flex key={classItem.name}padding="0px 3.5% 3.5% 14%"
//         borderRadius='10px'
//         // borderColor='black'
//         // borderWidth='1.8px'
//         marginTop='10px'
//         marginBottom='10px'
//         direction='row'
//         position='relative'>
//           <Flex align="center" fontSize='1.7rem'
//             alignItems='flex-start'
//             verticalAlign='top'
//             marginRight='6rem'>
//             {classItem.startTime}
//           </Flex>
//           {/* colored vertical line */}
//           <span
//             style={{
//               position: 'absolute',
//               borderRadius: '10px',
//               height: '4rem',
//               width: '7px',
//               backgroundColor: classItem.borderColor,
//               margin: '10px 30px 0px 15.5%',
//               right: '47%'
//             }}
//             ></span>
//           <Flex align="center"
//             fontSize='1.1rem'
//             height='4.5rem'
//             alignItems='flex-start'
//             textAlign='left'
//             marginTop='2%'
//             color='#84838D'
//             direction='column'
//             overflow='hidden'
//             whiteSpace='nowrap'
//             textOverflow='ellipsis'
//           >
//             <Flex>
//             {classItem.name}
//             </Flex>
//             <Flex paddingTop='10px'>
//             {classItem.lecturerName}
//             </Flex>
//           </Flex>
//         </Flex>
//       ))}
//       </Box>
//     )
// }

// export default TimeTable;

const initialClassItems = [
  {
    name: "물리 11학년 HL",
    lecturerName: "조연준 강사님",
    startTime: "00:00",
    end_time: "01:00",
    borderColor: "#FF7783",
  },
  {
    name: "수학 12학년 SL",
    lecturerName: "이엘림 강사님",
    startTime: "01:00",
    end_time: "02:00",
    borderColor: "#8FD8A0",
  },
  {
    name: "화학 11학년 SL",
    lecturerName: "마재훈 강사님",
    startTime: "02:00",
    end_time: "03:00",
    borderColor: "#45BFFF",
  },
  {
    name: "영어 10학년 HL",
    lecturerName: "김영희 강사님",
    startTime: "10:00",
    end_time: "11:00",
    borderColor: "#FFA500",
  },
  {
    name: "생물 12학년 HL",
    lecturerName: "박철수 강사님",
    startTime: "14:00",
    end_time: "15:00",
    borderColor: "#8A2BE2",
  },
  {
    name: "경제 11학년 SL",
    lecturerName: "이지은 강사님",
    startTime: "11:00",
    end_time: "12:00",
    borderColor: "#20B2AA",
  },
  {
    name: "역사 10학년 SL",
    lecturerName: "정민우 강사님",
    startTime: "15:00",
    end_time: "16:00",
    borderColor: "#FF69B4",
  },
  {
    name: "심리 12학년 HL",
    lecturerName: "송혜교 강사님",
    startTime: "12:00",
    end_time: "13:00",
    borderColor: "#32CD32",
  },
  {
    name: "미술 11학년 SL",
    lecturerName: "홍길동 강사님",
    startTime: "17:00",
    end_time: "18:00",
    borderColor: "#FF4500",
  },
  {
    name: "체육 10학년 SL",
    lecturerName: "강동원 강사님",
    startTime: "18:00",
    end_time: "19:00",
    borderColor: "#1E90FF",
  },
  {
    name: "음악 12학년 HL",
    lecturerName: "이순신 강사님",
    startTime: "19:00",
    end_time: "20:00",
    borderColor: "#FF1493",
  },
  {
    name: "지리 11학년 SL",
    lecturerName: "유관순 강사님",
    startTime: "20:00",
    end_time: "21:00",
    borderColor: "#00CED1",
  },
  {
    name: "컴퓨터 10학년 HL",
    lecturerName: "안중근 강사님",
    startTime: "21:00",
    end_time: "22:00",
    borderColor: "#9400D3",
  },
];
import React, { useRef, useEffect, useState } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import instance from "@/apis/axiosInstance";

function convertTimeToDate(timeString) {
  const [hours, minutes] = timeString.split(":");
  const now = new Date();
  now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return now;
}

function formatTimeWithoutSeconds(timeString) {
  return timeString.substring(0, 5); // "HH:MM:SS" becomes "HH:MM"
}

export default function TimeTable() {
  const scrollRef = useRef(null);
  const [classItems, setClassItems] = useState([]);

  useEffect(() => {
    fetchClassItemsList();
    const now = new Date();
    const firstUpcomingIndex = classItems.findIndex(
      (item) => convertTimeToDate(item.end_time) > now
    );

    if (scrollRef.current && firstUpcomingIndex !== -1) {
      const upcomingElement =
        scrollRef.current.children[0].children[firstUpcomingIndex];
      if (upcomingElement) {
        scrollRef.current.scrollTop = upcomingElement.offsetTop;
      }
    }
  }, []);

  const fetchClassItemsList = async () => {
    try {
      const response = await instance.get("/api/students/me/timetable");
      console.log("received class items list response:", response.data);

      setClassItems(response.data);
    } catch (error) {
      console.error("Error fetching class items list:", error);
    }
  };

  return (
    <Box
      h="300px"
      overflowY="auto"
      position="relative"
      ref={scrollRef}
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
        {classItems.map((classItem, index) => {
          const now = new Date();
          const itemEndTime = convertTimeToDate(classItem.end_time);
          const opacity = itemEndTime < now ? 0.3 : 1;

          return (
            <Flex
              key={index}
              p={4}
              borderRadius="10px"
              borderLeft="7px solid"
              borderLeftColor={classItem.fg_color}
              boxShadow="md"
              opacity={opacity}
            >
              <Text fontSize="xl" fontWeight="bold" mr={8}>
                {formatTimeWithoutSeconds(classItem.start_time)}
              </Text>
              <Box>
                <Text fontWeight="semibold" style={{ textAlign: "left" }}>
                  {classItem.subject_name}&nbsp;{classItem.level_name}
                  &nbsp;({classItem.mode_name})
                </Text>
                <Text
                  fontSize="sm"
                  color="black.600"
                  fontWeight="semibold"
                  style={{ textAlign: "left" }}
                >
                  {classItem.teacher_name}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </VStack>
      <Box
        position="sticky"
        bottom={0}
        left={0}
        right={0}
        height="100px"
        // bgGradient="linear(to-t, white, transparent)"
        pointerEvents="none"
      />
    </Box>
  );
}
