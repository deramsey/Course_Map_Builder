import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

const today = new Date();
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

// Helper to generate unique IDs for objectives
const generateUniqueId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  // --- Objective Management with Unique IDs ---

  const addObjective = (moduleIndex) => {
    const newObjective = { id: generateUniqueId(), text: '' };
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex].objectives = [
      ...(updatedModules[moduleIndex].objectives || []),
      newObjective
    ];
    setCourse({ ...course, modules: updatedModules });
  };

  const updateObjective = (moduleIndex, objIndex, text) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex].objectives[objIndex].text = text;
    setCourse({ ...course, modules: updatedModules });
  };

  const removeObjective = (moduleIndex, objIndex) => {
    const updatedModules = [...course.modules];
    const module = updatedModules[moduleIndex];
    const objectiveToRemove = module.objectives[objIndex];
    const objectiveIdToRemove = objectiveToRemove.id;

    // 1. Filter out the deleted objective
    module.objectives = module.objectives.filter((_, i) => i !== objIndex);

    // 2. Clean up dangling references in resources, activities, and assessments
    ['resources', 'activities', 'assessments'].forEach(field => {
      if (module[field]) {
        module[field].forEach(item => {
          item.relatedObjectives = (item.relatedObjectives || []).filter(
            refId => refId !== objectiveIdToRemove
          );
        });
      }
    });

    setCourse({ ...course, modules: updatedModules });
  };


  const exportToJSON = () => {
    const dataStr = JSON.stringify(course, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${course.courseNumber}_course_data${today.getDate()}${today.getMonth()}${today.getFullYear()}.json`;

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
          // Simple validation to ensure objectives have IDs. Can be expanded.
          importedCourse.modules.forEach(module => {
            if (module.objectives && module.objectives.every(obj => typeof obj === 'string')) {
              module.objectives = module.objectives.map(text => ({ id: generateUniqueId(), text }));
            }
          });
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
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    doc.setLanguage("en-US");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - 2 * margin;

    let yPos = margin;

    doc.setFontSize(24);
    doc.setTextColor(0, 51, 102);
    doc.text('Course Map', pageWidth / 2, yPos, { align: 'center' });
    yPos += 30;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Course: ${course.courseNumber} - ${course.courseName}`, margin, yPos);
    yPos += 20;

    doc.setFontSize(12);
    doc.text('Description:', margin, yPos);
    yPos += 15;
    const descriptionLines = doc.splitTextToSize(course.description, maxWidth);
    doc.text(descriptionLines, margin, yPos);
    yPos += descriptionLines.length * 14 + 10;

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Student Learning Outcomes:', margin, yPos);
    yPos += 20;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('At the end of this course, the learner will be able to:', margin, yPos);
    yPos += 15;

    const SLOLetter = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
    course.learningOutcomes.forEach((slo, index) => {
      const sloText = `${SLOLetter[index]}. ${slo}`;
      const sloLines = doc.splitTextToSize(sloText, maxWidth - 20);
      if (yPos + sloLines.length * 14 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(sloLines, margin + 10, yPos);
      yPos += sloLines.length * 14 + 5;
    });

    course.modules.forEach((module, moduleIndex) => {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text(`Module ${moduleIndex + 1}: ${module.title}`, margin, yPos);
      yPos += 20;

      const moduleSLOs = (module.relatedSLOs || []).map(sloIndex => `${SLOLetter[sloIndex]}`).join(', ');
      
      // Create a map for quick lookup of objective index by its ID
      const objectiveIdToIndexMap = new Map();
      (module.objectives || []).forEach((obj, index) => {
          objectiveIdToIndexMap.set(obj.id, index);
      });

      doc.autoTable({
        startY: yPos,
        headStyles:{ fillColor: [0, 51, 102] },
        head: [['Objectives', 'Mapped SLOs', 'Resources', 'Activities', 'Assessments']],
        body: [
          [
            (module.objectives || []).map((obj, objIndex) => `${renderObjectiveNumber(moduleIndex, objIndex)} ${obj.text}`).join('\n'),
            moduleSLOs,
            (module.resources || []).map(r => `${r.content} (Obj: ${(r.relatedObjectives || []).map(objId => renderObjectiveNumber(moduleIndex, objectiveIdToIndexMap.get(objId))).join(', ')})`).join('\n'),
            (module.activities || []).map(a => `${a.content} (Obj: ${(a.relatedObjectives || []).map(objId => renderObjectiveNumber(moduleIndex, objectiveIdToIndexMap.get(objId))).join(', ')})`).join('\n'),
            (module.assessments || []).map(a => `${a.content} (Obj: ${(a.relatedObjectives || []).map(objId => renderObjectiveNumber(moduleIndex, objectiveIdToIndexMap.get(objId))).join(', ')})`).join('\n')
          ]
        ],
        styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: { 0: {cellWidth: '20%'}, 1: {cellWidth: '10%'}, 2: {cellWidth: '23%'}, 3: {cellWidth: '23%'}, 4: {cellWidth: '24%'} },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        didDrawPage: (data) => {
          doc.setFontSize(10);
          doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
        },
        showHead: 'everyPage'
      });
      yPos = doc.lastAutoTable.finalY + 20;
    });

    doc.setProperties({
      title: `${course.courseName} Course Map`,
      subject: `Course map for ${course.courseName}`,
      author: "CCC Yetis",
      keywords: "course map",
      creator: "Web Form"
    });
    
    doc.save(`${course.courseNumber}_course_map.pdf`);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(course.modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCourse({ ...course, modules: items });
  };

  return (
    <Container maxWidth="lg">
      <ThemeProvider theme={theme}>
        <header>
          <Typography variant="h2" component="h1">Course Map Builder</Typography>
        </header>
        <main>
          <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>Course Map</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Course Number" name="courseNumber" value={course.courseNumber} onChange={handleCourseChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Course Name" name="courseName" value={course.courseName} onChange={handleCourseChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={4} label="Course Description" name="description" value={course.description} onChange={handleCourseChange} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Student Learning Outcomes</Typography>
              {course.learningOutcomes.map((slo, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField fullWidth value={slo} onChange={(e) => updateSLO(index, e.target.value)} label={`SLO ${index + 1}`} sx={{ mr: 2 }} />
                  <IconButton onClick={() => removeSLO(index)} color="error"><DeleteIcon /></IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} onClick={addSLO} variant="outlined">Add SLO</Button>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Modules</Typography>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {course.modules.map((module, moduleIndex) => (
                        <Draggable key={module.title + moduleIndex} draggableId={`module-${moduleIndex}`} index={moduleIndex}>
                          {(provided) => (
                            <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ p: 3, mb: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Module {moduleIndex + 1}</Typography>
                                <Button onClick={() => removeModule(moduleIndex)} variant="outlined" color="error" startIcon={<DeleteIcon />}>Remove Module</Button>
                              </Box>
                              <TextField fullWidth label="Module Title" value={module.title} onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)} sx={{ mb: 2 }} />
                              <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Related SLOs</InputLabel>
                                <Select multiple value={module.relatedSLOs || []} onChange={(e) => handleModuleChange(moduleIndex, 'relatedSLOs', e.target.value)} label="Related SLOs">
                                  {course.learningOutcomes.map((slo, index) => (
                                    <MenuItem key={index} value={index}>{`SLO ${index + 1}: ${slo.length > 50 ? slo.substring(0, 50) + '...' : slo}`}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Typography variant="subtitle1" gutterBottom>Objectives</Typography>
                              {(module.objectives || []).map((objective, objIndex) => (
                                <Box key={objective.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography sx={{ mr: 2, minWidth: '30px' }}>{renderObjectiveNumber(moduleIndex, objIndex)}</Typography>
                                  <TextField fullWidth value={objective.text} onChange={(e) => updateObjective(moduleIndex, objIndex, e.target.value)} label={`Objective ${objIndex + 1}`} sx={{ mr: 2 }} />
                                  <IconButton onClick={() => removeObjective(moduleIndex, objIndex)} color="error"><DeleteIcon /></IconButton>
                                </Box>
                              ))}
                              <Button startIcon={<AddIcon />} onClick={() => addObjective(moduleIndex)} variant="outlined" sx={{ mb: 2 }}>Add Objective</Button>

                              {['resources', 'activities', 'assessments'].map(field => (
                                <Box key={field} sx={{ mb: 2 }}>
                                  <Typography variant="subtitle1" gutterBottom>{field.charAt(0).toUpperCase() + field.slice(1)}</Typography>
                                  {(module[field] || []).map((item, itemIndex) => (
                                    <Box key={itemIndex} sx={{ mb: 2 }}>
                                      <TextField fullWidth value={item.content} onChange={(e) => updateModuleItem(moduleIndex, field, itemIndex, e.target.value, item.relatedObjectives)} label={`${field.slice(0, -1)} ${itemIndex + 1}`} sx={{ mb: 1 }} />
                                      <FormControl fullWidth sx={{ mb: 1 }}>
                                        <InputLabel>Related Objectives</InputLabel>
                                        <Select
                                          multiple
                                          value={item.relatedObjectives || []}
                                          onChange={(e) => updateModuleItem(moduleIndex, field, itemIndex, item.content, e.target.value)}
                                          label="Related Objectives"
                                        >
                                          {(module.objectives || []).map((obj) => (
                                            <MenuItem key={obj.id} value={obj.id}>
                                              {obj.text}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      <Button onClick={() => removeModuleItem(moduleIndex, field, itemIndex)} variant="outlined" color="error" startIcon={<DeleteIcon />}>Remove</Button>
                                    </Box>
                                  ))}
                                  <Button startIcon={<AddIcon />} onClick={() => addModuleItem(moduleIndex, field)} variant="outlined">Add {field.slice(0, -1)}</Button>
                                </Box>
                              ))}
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Button startIcon={<AddIcon />} onClick={addModule} variant="outlined" sx={{ mb: 2 }}>Add Module</Button>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={exportToPDF}>Export to PDF</Button>
              <Button variant="contained" color="secondary" onClick={exportToJSON}>Save as JSON</Button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={importFromJSON} accept=".json" />
              <Button variant="contained" color="info" onClick={() => fileInputRef.current.click()}>Load JSON</Button>
            </Box>
          </Box>
        </main>
      </ThemeProvider>
    </Container>
  );
};

export default CourseForm;
