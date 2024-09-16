import React from 'react';

const ModuleForm = ({ index, module, onModuleChange }) => {
  const handleModuleChange = (e) => {
    const updatedModule = {
      ...module,
      [e.target.name]: e.target.value
    };
    onModuleChange(index, updatedModule);
  };

  return (
    <div>
      <h2>Module {index + 1}</h2>
      <input
        type="text"
        name="title"
        placeholder="Module Title"
        value={module.title}
        onChange={handleModuleChange}
      />
      <textarea
        name="objectives"
        placeholder="Module Objectives"
        value={module.objectives}
        onChange={handleModuleChange}
      />
      <textarea
        name="resources"
        placeholder="Learning Resources"
        value={module.resources}
        onChange={handleModuleChange}
      />
      <textarea
        name="activities"
        placeholder="Learning Activities"
        value={module.activities}
        onChange={handleModuleChange}
      />
      <textarea
        name="assessments"
        placeholder="Assessments"
        value={module.assessments}
        onChange={handleModuleChange}
      />
    </div>
  );
};

export default ModuleForm;
