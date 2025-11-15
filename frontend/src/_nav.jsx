import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
  cilTask,
} from "@coreui/icons";
import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";

const _nav = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: "info",
    },
  },

  {
    component: CNavTitle,
    name: "Tabs",
  },
  {
    component: CNavGroup,
    name: "Homework",
    to: "/homework",
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Create",
        to: "/homework/create",
      },
      {
        component: CNavItem,
        name: "Grade",
        to: "/homework/grade",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Attendance",

    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Code",
        to: "/attendance/code",
      },
      {
        component: CNavItem,
        name: "Info",
        to: "/attendance/info",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Tables",

    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Scores",
        to: "/scores",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Settings",
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Timetable",
        to: "/settings/timetable",
      },
      {
        component: CNavItem,
        name: "Students",
        to: "/settings/students",
      },
      {
        component: CNavItem,
        name: "Teachers",
        to: "/settings/teachers",
      },
      {
        component: CNavItem,
        name: "Parents",
        to: "/settings/parents",
      },
      {
        component: CNavItem,
        name: "Parent-Student",
        to: "/settings/parent-student",
      },
      {
        component: CNavItem,
        name: "Manual-Student",
        to: "/settings/manual-student",
      },
      {
        component: CNavItem,
        name: "Configuration",
        to: "/settings/config",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Report",
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Comment",
        to: "/report/comments",
      },
      {
        component: CNavItem,
        name: "Management",
        to: "/report/management",
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Private Tutoring",
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Dashboard",
        to: "/private-tutoring/dashboard",
      },
      {
        component: CNavItem,
        name: "Students",
        to: "/private-tutoring/students",
      },
      {
        component: CNavItem,
        name: "Sessions",
        to: "/private-tutoring/sessions",
      },
      {
        component: CNavItem,
        name: "Schedule",
        to: "/private-tutoring/schedule",
      },
      {
        component: CNavItem,
        name: "Reports",
        to: "/private-tutoring/reports",
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Extras",
  },
  // {
  //   component: CNavGroup,
  //   name: 'Pages',
  //   icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: 'Login',
  //       to: '/login',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Register',
  //       to: '/register',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 404',
  //       to: '/404',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 500',
  //       to: '/500',
  //     },
  //   ],
  // },
  // {
  //   component: CNavItem,
  //   name: 'Docs',
  //   href: 'https://coreui.io/react/docs/templates/installation/',
  //   icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  // },
];

export default _nav;
