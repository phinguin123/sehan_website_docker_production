import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilSpeedometer,
  cilPeople,
  cilEducation,
  cilTask,
  cilCalendar,
  cilChart,
  cilCheckCircle,
  cilHistory,
} from "@coreui/icons";
import { CNavItem } from "@coreui/react";

const _nav_private_tutoring = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/private-tutoring/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: "info",
    },
  },
  {
    component: CNavItem,
    name: "Students",
    to: "/private-tutoring/students",
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Teachers",
    to: "/private-tutoring/teachers",
    icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Session Manager",
    to: "/private-tutoring/session-manager",
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Complete Session",
    to: "/private-tutoring/complete-session",
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    badge: {
      color: "success",
      text: "New",
    },
  },
  {
    component: CNavItem,
    name: "Sessions",
    to: "/private-tutoring/sessions",
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Reports",
    to: "/private-tutoring/reports",
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
];

export default _nav_private_tutoring;
