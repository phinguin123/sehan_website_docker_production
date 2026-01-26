import React, {useRef} from 'react'
import {
    IconButton,
    Box,
    CloseButton,
    Flex,
    Icon,
    Text,
    Drawer,
    DrawerContent,
    useDisclosure,
  } from '@chakra-ui/react'

  
const ClassItems = [
    { name: '물리 11학년 HL', lecturerName: '조연준 강사님', startTime: '09:00', endTime: '10:00', borderColor: '#FF7783' },
    { name: '수학 12학년 SL', lecturerName: '이엘림 강사님', startTime: '13:00', endTime: '14:00', borderColor: '#8FD8A0' },
    { name: '화학 11학년 SL', lecturerName: '마재훈 강사님', startTime: '16:00', endTime: '17:00', borderColor: '#45BFFF' },
    ]


function PendingHomework(){
  const scrollRef = useRef(null);

    return (
        <Box marginTop='50px' ref={{scrollRef}} overflowY="auto" h="400px" css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '24px',
          },
        }}>
      {ClassItems.map((classItem) => (
        <Flex key={classItem.name}padding="0px 16px 16px 16px" 
        borderRadius='10px' 
        // borderColor='black' 
        // borderWidth='1.8px' 
        marginTop='10px' 
        marginBottom='10px'
        direction='row'>
          <Flex align="center" fontSize='300px'
            alignItems='flex-start'
            verticalAlign='top'>
            {classItem.startTime}
          </Flex>
          <span 
            style={{borderRadius: '10px',
              height: '70px',
              width: '7px',
              backgroundColor: classItem.borderColor,
              margin: '10px 30px 0px 60px',
              
            }}
            ></span>
          <Flex align="center"
            fontSize='20px'
            height='80px'
            alignItems='flex-start'
            textAlign='left'
            marginTop='10px'
            color='#84838D'
            direction='column'
          >
            <Flex>
            {classItem.name}
            </Flex>
            <Flex paddingTop='10px'>
            {classItem.lecturerName}
            </Flex>
          </Flex>
        </Flex>
      ))}
      </Box>
    )
}

export default PendingHomework