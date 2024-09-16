import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green, indigo } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: green[500],
    },
    secondary: {
      main: indigo[900],
    },
  },
});



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
    <Container maxWidth="lg">
      <ThemeProvider theme={theme}>
            <header>
        <Typography variant="h2" component="h1">Course Map Builder</Typography>
      </header>
      <main>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Course Map
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Course Number"
              name="courseNumber"
              value={course.courseNumber}
              onChange={handleCourseChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Course Name"
              name="courseName"
              value={course.courseName}
              onChange={handleCourseChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Course Description"
              name="description"
              value={course.description}
              onChange={handleCourseChange}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Student Learning Outcomes
          </Typography>
          {course.learningOutcomes.map((slo, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                value={slo}
                onChange={(e) => updateSLO(index, e.target.value)}
                label={`SLO ${index + 1}`}
                sx={{ mr: 2 }}
              />
              <IconButton onClick={() => removeSLO(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addSLO} variant="outlined">
            Add SLO
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Modules
          </Typography>
          {course.modules.map((module, moduleIndex) => (
            <Paper key={moduleIndex} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Module {moduleIndex + 1}</Typography>
                <Button
                  onClick={() => removeModule(moduleIndex)}
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Remove Module
                </Button>
              </Box>

              <TextField
                fullWidth
                label="Module Title"
                value={module.title}
                onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Related SLOs</InputLabel>
                <Select
                  multiple
                  value={module.relatedSLOs || []}
                  onChange={(e) => handleModuleChange(moduleIndex, 'relatedSLOs', e.target.value)}
                  label="Related SLOs"
                >
                  {course.learningOutcomes.map((slo, index) => (
                    <MenuItem key={index} value={index}>{`SLO ${index + 1}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle1" gutterBottom>
                Objectives
              </Typography>
              {(module.objectives || []).map((objective, objIndex) => (
                <Box key={objIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ mr: 2, minWidth: '30px' }}>
                    {renderObjectiveNumber(moduleIndex, objIndex)}
                  </Typography>
                  <TextField
                    fullWidth
                    value={objective}
                    onChange={(e) => {
                      const updatedObjectives = [...(module.objectives || [])];
                      updatedObjectives[objIndex] = e.target.value;
                      handleModuleChange(moduleIndex, 'objectives', updatedObjectives);
                    }}
                    label={`Objective ${objIndex + 1}`}
                    sx={{ mr: 2 }}
                  />
                  <IconButton onClick={() => removeModuleItem(moduleIndex, 'objectives', objIndex)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleModuleChange(moduleIndex, 'objectives', [...(module.objectives || []), ''])}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Add Objective
              </Button>

              {['resources', 'activities', 'assessments'].map(field => (
                <Box key={field} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Typography>
                  {(module[field] || []).map((item, itemIndex) => (
                    <Box key={itemIndex} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        value={item.content}
                        onChange={(e) => updateModuleItem(moduleIndex, field, itemIndex, e.target.value)}
                        label={`${field === 'activities' ? 'Activity' : field.slice(0, -1)} ${itemIndex + 1}`}
                        sx={{ mb: 1 }}
                      />
                      <FormControl fullWidth sx={{ mb: 1 }}>
                        <InputLabel>Related Objectives</InputLabel>
                        <Select
                          multiple
                          value={item.relatedObjectives || []}
                          onChange={(e) => updateModuleItem(
                            moduleIndex,
                            field,
                            itemIndex,
                            item.content,
                            e.target.value
                          )}
                          label="Related Objectives"
                        >
                          {(module.objectives || []).map((obj, objIndex) => (
                            <MenuItem key={objIndex} value={objIndex}>
                              {renderObjectiveNumber(moduleIndex, objIndex)} {obj}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        onClick={() => removeModuleItem(moduleIndex, field, itemIndex)}
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addModuleItem(moduleIndex, field)}
                    variant="outlined"
                  >
                    Add {field === 'activities' ? 'Activity' : field.slice(0, -1)}
                  </Button>
                </Box>
              ))}
            </Paper>
          ))}
          <Button startIcon={<AddIcon />} onClick={addModule} variant="outlined" sx={{ mb: 2 }}>
            Add Module
          </Button>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={exportToPDF}>
            Export to PDF
          </Button>
          <Button variant="contained" color="secondary" onClick={exportToJSON}>
            Save as JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={importFromJSON}
            accept=".json"
          />
          <Button variant="contained" color="info" onClick={() => fileInputRef.current.click()}>
            Load JSON
          </Button>
        </Box>
      </Box>
      </main>
      </ThemeProvider>
    </Container>
  );
};

export default CourseForm;