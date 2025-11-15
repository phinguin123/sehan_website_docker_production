import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, getTeacherInfo } from '../utils/privateTutoringAuth';
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CButton,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilMenu } from "@coreui/icons";

const PrivateTutoringHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const headerRef = useRef();
  const [teacherName, setTeacherName] = useState('Teacher');
  const sidebarShow = useSelector((state) => state.sidebarShow);

  console.log('PrivateTutoringHeader rendering, current path:', location.pathname);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    // Get teacher name from auth utility
    const teacherInfo = getTeacherInfo();
    if (teacherInfo) {
      setTeacherName(teacherInfo.name || 'Teacher');
    }
  }, []);

  useEffect(() => {
    document.addEventListener("scroll", () => {
      headerRef.current &&
        headerRef.current.classList.toggle(
          "shadow-sm",
          document.documentElement.scrollTop > 0
        );
    });
  }, []);

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: "set", sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: "-14px" }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        
        <div className="d-flex align-items-center me-auto">
          <h4 className="mb-0 text-dark ms-3">Private Tutoring System</h4>
        </div>
        
        <CHeaderNav>
          <CButton color="dark" variant="ghost">
            {teacherName}
          </CButton>

          <CButton color="danger" variant="ghost" onClick={handleLogout}>
            Logout
          </CButton>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

export default PrivateTutoringHeader;