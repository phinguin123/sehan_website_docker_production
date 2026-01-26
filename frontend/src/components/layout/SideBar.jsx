import React, { useState, useEffect } from "react";
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
  Image,
} from "@chakra-ui/react";
import {
  FiHome,
  FiTrendingUp,
  FiCompass,
  FiStar,
  FiSettings,
  FiPieChart,
  FiCheckCircle,
  FiBook,
  FiEdit,
  FiMenu,
  FiChevronDown,
  FiChevronRight,
  FiTerminal,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import instance from "@/apis/axiosInstance";
import logo from "@/assets/images/logo.png";

const LinkItems = [
  { name: "홈", icon: FiHome, path: "/" },
  { name: "대시보드", icon: FiPieChart, path: "/grades" },
  { name: "출석", icon: FiCheckCircle, path: "/attendance" },
  { name: "숙제", icon: FiBook, path: "/homework", hasSubjects: true },
  { name: "HNY", icon: FiTerminal, path: "/happy-new-year" },
];

export default function SimpleSidebar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchStudentSubjectList = async () => {
      try {
        const response = await instance.get("/api/subjects/me");
        console.log("received subject list response:", response.data);
        setSubjects(response.data.map((subj) => subj.subject_name));
        console.log(
          "data to be saved in subjects",
          response.data.map((subj) => subj.subject_name)
        );
      } catch (error) {
        console.error("Error fetching subject list:", error);
      }
    };

    fetchStudentSubjectList();
  }, []);

  return (
    <Box
      minH="100%"
      width={{ base: 0, md: "14rem" }}
      bg="#F5F6FA"
      paddingTop="64px"
      borderRightWidth="1px"
      borderRightColor="#E1E4EC"
      position="fixed"
      zIndex="10"
    >
      <SidebarContent
        onClose={() => onClose}
        subjects={subjects}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} subjects={subjects} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      {/* <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} /> */}
    </Box>
  );
}

const SidebarContent = ({ onClose, subjects, ...rest }) => {
  return (
    <Box
      bg="#F5F6FA"
      w={{ base: "full", md: "100%" }}
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Image
          src={logo} // Replace with the path to your logo
          alt="Logo"
          width="100%"
        />
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          linkPath={link.path}
          subjects={link.hasSubjects ? subjects : null}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

const NavItem = ({ icon, children, linkPath, subjects, ...rest }) => {
  const [isOpen, setIsOpen] = useState(false);
  console.log("Subjects that should display", subjects);
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <Box
      as={subjects ? "div" : RouterLink} // Prevents routing on the main nav item
      to={subjects ? undefined : linkPath}
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
      width="100%"
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        width="80%"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        onClick={subjects ? toggleOpen : undefined}
        _hover={{
          bg: "cyan.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
        {subjects && isOpen && (
          <Icon ml="auto" fontSize="12" as={FiChevronDown} />
        )}
      </Flex>
      <AnimatePresence>
        {isOpen && subjects && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            {subjects.map((subject) => (
              <Box
                key={subject}
                as={RouterLink}
                to={`${linkPath}/${subject.toLowerCase()}`}
                pl="12"
                py="2"
                _hover={{
                  bg: "cyan.400",
                  color: "white",
                }}
              >
                {subject}
              </Box>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      justifyContent="flex-start"
      {...rest}
    >
      <IconButton
        variant="outline"
        onClick={onOpen}
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text fontSize="2xl" ml="8" fontFamily="monospace" fontWeight="bold">
        Logo
      </Text>
    </Flex>
  );
};
