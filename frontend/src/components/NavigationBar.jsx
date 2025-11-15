import PropTypes from "prop-types";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, AddIcon, BellIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import instance from "../apis/AxiosInterceptor";
import { useEffect, useState } from "react";

const Links = [
  { name: "Home", path: "/" },
  { name: "Dashboard", path: "/grades" },
  { name: "Attendance", path: "/attendance" },
];

const NavLink = (props) => {
  const { children, to, onClick } = props;
  return (
    <Box
      as={RouterLink}
      to={to}
      px={2}
      py={1}
      rounded={"md"}
      _hover={{
        textDecoration: "none",
        bg: useColorModeValue("gray.200", "gray.700"),
      }}
      onClick={onClick}
      //href={'grades'}
    >
      {children}
    </Box>
  );
};

NavLink.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  onClick: PropTypes.func,
};

export default function NavigationBar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [studentName, setStudentName] = useState("");

  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${
      import.meta.env.VITE_KAKAO_CLIENT_ID
    }&logout_redirect_uri=${import.meta.env.VITE_KAKAO_LOGOUT_REDIRECT_URI}`;

    console.log("kakao logout response", response);

    // navigate("/logout");
  };

  useEffect(() => {
    const fetchStudentName = async () => {
      try {
        const response = await instance.get("/student/getName");

        console.log("received student name data", response.data);

        setStudentName(response.data.name);
      } catch (error) {
        if (error.response) {
          // Display the backend error message using alert
          // alert(error.response.data.error || "An unexpected error occurred.");
          console.log(error.response.data.error);
        } else {
          // Handle client-side or network errors
          console.log(error);
          // alert("Failed to connect to the server. Please try again.");
        }
      }
    };

    fetchStudentName();
  }, []);

  return (
    <>
      <Box
        as="nav"
        bg={useColorModeValue("#FFFFFF", "gray.900")}
        px={4}
        position="fixed"
        width="100%"
        borderBottomWidth="1px"
        borderBottomColor="#E8EAEE"
        zIndex="9999"
      >
        <Flex
          h={16}
          alignItems={"center"}
          justifyContent={"space-between"}
          bg="white"
          zIndex="sticky"
        >
          {/* Hamburger button on mobile */}
          <IconButton
            size={"md"}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={"Open Menu"}
            display={{ md: "none" }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={"center"}>
            <Box fontSize="xl" style={{ marginLeft: "3.5rem" }}>
              세한 IB
            </Box>
            <HStack
              as={"nav"}
              spacing={4}
              display={{ base: "none", md: "flex" }}
            >
              {Links.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={"center"}>
            <div
              className="me-2"
              style={{ fontWeight: "bold", fontSize: "16px" }}
            >
              Hello, {studentName}
            </div>
            <Button
              variant={"link"}
              colorScheme={"tomato"}
              size={"lg"}
              mr={4}
              _hover={{
                color: "pink",
                bg: "white",
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Flex>

          {/* <Flex alignItems={'center'}>
            <Button
              variant={'link'}
              colorScheme={'red'}
              size={'lg'}
              _hover={{
                color: 'pink',
                bg: 'white'
              }}
              leftIcon={<BellIcon boxSize={6} />} />
            <Button
              variant={'solid'}
              colorScheme={'teal'}
              size={'sm'}
              mr={4}

              leftIcon={<AddIcon />}>
              업로드
            </Button>
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}>
                <Avatar
                  size={'sm'}
                  src={
                    'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                  }
                />
              </MenuButton>
              <MenuList>
                <MenuItem>Link 1</MenuItem>
                <MenuItem>Link 2</MenuItem>
                <MenuDivider />
                <MenuItem>Link 3</MenuItem>
              </MenuList>
            </Menu>
          </Flex> */}
        </Flex>

        {/* Mobile links (dropdown) */}
        {isOpen ? (
          <Box pb={4} display={{ md: "none" }}>
            <Stack as={"nav"} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link.name} to={link.path} onClick={onClose}>
                  {link.name}
                </NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>

      {/* <Box p={4}>Main Content Here</Box> */}
    </>
  );
}
