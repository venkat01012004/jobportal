import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobsBrowse from './pages/JobsBrowse';
import JobDetails from './pages/JobDetails';
import MyApplications from './pages/MyApplications';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobForm from './pages/JobForm';
import Applicants from './pages/Applicants';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<JobsBrowse />} />
            <Route path="/jobs/:id" element={<JobDetails />} />

            <Route
              path="/my-applications"
              element={
                <PrivateRoute allowedRole="jobseeker">
                  <MyApplications />
                </PrivateRoute>
              }
            />

            <Route
              path="/recruiter"
              element={
                <PrivateRoute allowedRole="recruiter">
                  <RecruiterDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/recruiter/post-job"
              element={
                <PrivateRoute allowedRole="recruiter">
                  <JobForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:id/edit"
              element={
                <PrivateRoute allowedRole="recruiter">
                  <JobForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:jobId/applicants"
              element={
                <PrivateRoute allowedRole="recruiter">
                  <Applicants />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
