import React from 'react';
import { Outlet } from 'react-router-dom';
import PrivateTutoringSidebar from '../components/PrivateTutoringSidebar';
import PrivateTutoringHeader from '../components/PrivateTutoringHeader';

const PrivateTutoringLayout = () => {
  console.log('PrivateTutoringLayout rendering...');
  
  return (
    <div>
      <PrivateTutoringSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <PrivateTutoringHeader />
        <div className="body flex-grow-1">
          <div className="container-fluid p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateTutoringLayout;
