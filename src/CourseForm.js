import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const CourseForm = () => {
  const [course, setCourse] = useState({
    courseNumber: '',
    courseName: '',
    description: '',
    learningOutcomes: [],
    modules: []
  });

  const fileInputRef = useRef();

  const addSLO = () => {
    setCourse(prevState => ({
      ...prevState,
      learningOutcomes: [...prevState.learningOutcomes, '']
    }));
  };

  const updateSLO = (index, value) => {
    const updatedSLOs = [...course.learningOutcomes];
    updatedSLOs[index] = value;
    setCourse({ ...course, learningOutcomes: updatedSLOs });
  };

  const addModule = () => {
    setCourse(prevState => ({
      ...prevState,
      modules: [...prevState.modules, { 
        title: '', 
        relatedSLOs: [],
        objectives: [], 
        resources: [], 
        activities: [], 
        assessments: [] 
      }]
    }));
  };

  const handleCourseChange = (e) => {
    setCourse({
      ...course,
      [e.target.name]: e.target.value
    });
  };

  const handleModuleChange = (moduleIndex, field, value) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      [field]: value
    };
    setCourse({ ...course, modules: updatedModules });
  };

  const addModuleItem = (moduleIndex, field) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      [field]: [
        ...(updatedModules[moduleIndex][field] || []),
        { content: '', relatedObjectives: [] }
      ]
    };
    setCourse({ ...course, modules: updatedModules });
  };

  const updateModuleItem = (moduleIndex, field, itemIndex, content, relatedObjectives) => {
    const updatedModules = [...course.modules];
    const updatedItems = [...(updatedModules[moduleIndex][field] || [])];
    updatedItems[itemIndex] = { 
      content, 
      relatedObjectives: relatedObjectives || updatedItems[itemIndex]?.relatedObjectives || []
    };
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      [field]: updatedItems
    };
    setCourse({ ...course, modules: updatedModules });
  };

  const renderObjectiveNumber = (moduleIndex, objectiveIndex) => {
    return `${moduleIndex + 1}.${objectiveIndex + 1}`;
  };

  const removeSLO = (index) => {
    setCourse(prevState => ({
      ...prevState,
      learningOutcomes: prevState.learningOutcomes.filter((_, i) => i !== index)
    }));
  };

  const removeModule = (moduleIndex) => {
    setCourse(prevState => ({
      ...prevState,
      modules: prevState.modules.filter((_, i) => i !== moduleIndex)
    }));
  };

  const removeModuleItem = (moduleIndex, field, itemIndex) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      [field]: updatedModules[moduleIndex][field].filter((_, i) => i !== itemIndex)
    };
    setCourse({ ...course, modules: updatedModules });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(course, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'course_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFromJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCourse = JSON.parse(e.target.result);
          setCourse(importedCourse);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Error loading file. Please make sure it\'s a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Title and course info
    doc.setFontSize(18);
    doc.text('Course Map', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Course: ${course.courseNumber} - ${course.courseName}`, 14, 25);
    
    // Description
    doc.setFontSize(11);
    doc.text('Description:', 14, 35);
    const descriptionLines = doc.splitTextToSize(course.description, 260);
    doc.text(descriptionLines, 14, 40);
    
    // SLOs
    let SLOLetter = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
    let yPos = 40 + (descriptionLines.length * 5);
    doc.setFontSize(11);

    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.text('Student Learning Outcomes:', 14, yPos);
    yPos += 10;
    doc.text('At the end of this course, the learner will be able to:', 14, yPos);
    
    yPos += 5;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - 2 * margin;

    course.learningOutcomes.forEach((slo, index) => {
      const sloText = `${SLOLetter[index]}. ${slo}`;
      const sloLines = doc.splitTextToSize(sloText, maxWidth);
      
      // Check if we need to start a new page
      if (yPos + sloLines.length * 5 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(sloLines, 20, yPos);
      yPos += sloLines.length * 5 + 2; // Add some extra space between SLOs
    });
    
    // Modules
    yPos += 10;
    course.modules.forEach((module, moduleIndex) => {
      if (yPos > 180) {  // Check if we need a new page
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`Module ${moduleIndex + 1}: ${module.title}`, 14, yPos);
      yPos += 10;
      
      // Prepare SLOs for this module
      const moduleSLOs = (module.relatedSLOs || [])
        .map(sloIndex => `${SLOLetter[sloIndex]}`)
        .join(', ');
      
      // Module content table
      doc.autoTable({
        startY: yPos,
        head: [['Objectives', 'Mapped SLOs', 'Resources', 'Activities', 'Assessments']],
        body: [
          [
            (module.objectives || []).map((obj, objIndex) => 
              `${renderObjectiveNumber(moduleIndex, objIndex)} ${obj}`
            ).join('\n'),
            moduleSLOs,  // Add the mapped SLOs column
            (module.resources || []).map(r => 
              `${r.content} (Obj: ${(r.relatedObjectives || []).map(objIndex => renderObjectiveNumber(moduleIndex, parseInt(objIndex))).join(', ')})`
            ).join('\n'),
            (module.activities || []).map(a => 
              `${a.content} (Obj: ${(a.relatedObjectives || []).map(objIndex => renderObjectiveNumber(moduleIndex, parseInt(objIndex))).join(', ')})`
            ).join('\n'),
            (module.assessments || []).map(a => 
              `${a.content} (Obj: ${(a.relatedObjectives || []).map(objIndex => renderObjectiveNumber(moduleIndex, parseInt(objIndex))).join(', ')})`
            ).join('\n')
          ]
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 
          0: {cellWidth: 50}, 
          1: {cellWidth: 30},  // Width for the new SLOs column
          2: {cellWidth: 55}, 
          3: {cellWidth: 55}, 
          4: {cellWidth: 55}
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    });
    
    doc.save('course_map.pdf');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Course Map</h1>
      <input
        type="text"
        name="courseNumber"
        placeholder="Course Number"
        value={course.courseNumber}
        onChange={handleCourseChange}
        style={{ display: 'block', marginBottom: '10px', padding: '5px' }}
      />
      <input
        type="text"
        name="courseName"
        placeholder="Course Name"
        value={course.courseName}
        onChange={handleCourseChange}
        style={{ display: 'block', marginBottom: '10px', padding: '5px' }}
      />
      <textarea
        name="description"
        placeholder="Course Description"
        value={course.description}
        onChange={handleCourseChange}
        style={{ display: 'block', marginBottom: '20px', padding: '5px', width: '100%', height: '100px' }}
      />
      
      <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Student Learning Outcomes</h2>
      {course.learningOutcomes.map((slo, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="text"
            value={slo}
            onChange={(e) => updateSLO(index, e.target.value)}
            placeholder={`SLO ${index + 1}`}
            style={{ flex: 1, marginRight: '10px', padding: '5px' }}
          />
          <button onClick={() => removeSLO(index)} style={{ padding: '5px 10px' }}>x</button>
        </div>
      ))}
      <button onClick={addSLO} style={{ marginBottom: '20px', padding: '5px 10px' }}>Add SLO</button>
      
      <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Modules</h2>
      {course.modules.map((module, moduleIndex) => (
        <div key={moduleIndex} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Module {moduleIndex + 1}</h3>
            <button onClick={() => removeModule(moduleIndex)} style={{ padding: '5px 10px' }}>Remove Module</button>
          </div>

          <input
            type="text"
            value={module.title}
            onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
            placeholder="Module Title"
            style={{ display: 'block', marginBottom: '10px', padding: '5px', width: '100%' }}
          />
          
          <select
            multiple
            value={module.relatedSLOs || []}
            onChange={(e) => handleModuleChange(moduleIndex, 'relatedSLOs', Array.from(e.target.selectedOptions, option => option.value))}
            style={{ display: 'block', marginBottom: '10px', padding: '5px' }}
          >
            {course.learningOutcomes.map((slo, index) => (
              <option key={index} value={index}>{`SLO ${index + 1}`}</option>
            ))}
          </select>
          
          <h4 style={{ fontSize: '16px', marginBottom: '5px' }}>Objectives</h4>
          {(module.objectives || []).map((objective, objIndex) => (
            <div key={objIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ marginRight: '10px', minWidth: '30px' }}>{renderObjectiveNumber(moduleIndex, objIndex)}</span>
              <input
                type="text"
                value={objective}
                onChange={(e) => {
                  const updatedObjectives = [...(module.objectives || [])];
                  updatedObjectives[objIndex] = e.target.value;
                  handleModuleChange(moduleIndex, 'objectives', updatedObjectives);
                }}
                placeholder={`Objective ${objIndex + 1}`}
                style={{ flex: 1, padding: '5px', marginRight: '10px' }}
              />
              <button onClick={() => removeModuleItem(moduleIndex, 'objectives', objIndex)} style={{ padding: '5px 10px' }}>x</button>
            </div>
          ))}
          <button onClick={() => handleModuleChange(moduleIndex, 'objectives', [...(module.objectives || []), ''])} style={{ padding: '5px 10px', marginBottom: '15px' }}>Add Objective</button>

          {['resources', 'activities', 'assessments'].map(field => (
            <div key={field} style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '16px', marginBottom: '5px' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</h4>
              {(module[field] || []).map((item, itemIndex) => (
                <div key={itemIndex} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={item.content}
                      onChange={(e) => updateModuleItem(moduleIndex, field, itemIndex, e.target.value)}
                      placeholder={`${field === 'activities' ? 'Activity' : field.slice(0, -1)} ${itemIndex + 1}`}
                      style={{ flex: 1, marginRight: '10px', padding: '5px' }}
                    />
                    <button onClick={() => removeModuleItem(moduleIndex, field, itemIndex)} style={{ padding: '5px 10px' }}>x</button>
                  </div>
                  <select
                    multiple
                    value={item.relatedObjectives || []}
                    onChange={(e) => updateModuleItem(
                      moduleIndex, 
                      field, 
                      itemIndex, 
                      item.content, 
                      Array.from(e.target.selectedOptions, option => option.value)
                    )}
                    style={{ display: 'block', marginTop: '5px', padding: '5px', width: '100%' }}
                  >
                    {(module.objectives || []).map((obj, objIndex) => (
                      <option key={objIndex} value={objIndex}>
                        {renderObjectiveNumber(moduleIndex, objIndex)} {obj}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button onClick={() => addModuleItem(moduleIndex, field)} style={{ padding: '5px 10px' }}>Add {field === 'activities' ? 'Activity' : field.slice(0, -1)}</button>
            </div>
          ))}
        </div>
      ))}
      <button onClick={addModule} style={{ marginBottom: '20px', padding: '5px 10px' }}>Add Module</button>
      
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={exportToPDF} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>Export to PDF</button>
        <button onClick={exportToJSON} style={{ padding: '10px 20px', backgroundColor: '#008CBA', color: 'white', border: 'none', cursor: 'pointer' }}>Save as JSON</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={importFromJSON}
          accept=".json"
        />
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>Load JSON</button>
      </div>
    </div>
  );
};

export default CourseForm;