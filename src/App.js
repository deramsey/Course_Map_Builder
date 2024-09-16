import React from 'react';
import './App.css';
import CourseForm from './CourseForm'; // Import your form component

const App = () => {
  return (
    <div>
      <header>
        <h1>Course Map Application</h1>
      </header>
      <main>
        <CourseForm />  {/* Main form handling course and modules */}
      </main>
    </div>
  );
};

export default App;
