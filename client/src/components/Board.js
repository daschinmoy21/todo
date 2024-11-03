import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Paper,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { createList, createTask, getLists, getBoard, moveTask } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import ChatPanel from './ChatPanel';
import ChatIcon from '@mui/icons-material/Chat';
import TaskComments from './TaskComments';

function Board() {
  const { id: boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '' });
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    const loadBoardData = async () => {
      try {
        const [boardResponse, listsResponse] = await Promise.all([
          getBoard(boardId),
          getLists(boardId)
        ]);
        setBoard(boardResponse.data);
        setLists(listsResponse.data);
      } catch (err) {
        console.error('Error loading board data:', err);
      }
    };

    loadBoardData();
  }, [boardId]);

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    
    try {
      await createList(boardId, newListTitle);
      const response = await getLists(boardId);
      setLists(response.data);
      setNewListDialogOpen(false);
      setNewListTitle('');
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskData.title.trim()) return;

    try {
      await createTask(selectedListId, newTaskData.title, newTaskData.description);
      const response = await getLists(boardId);
      setLists(response.data);
      setNewTaskDialogOpen(false);
      setNewTaskData({ title: '', description: '' });
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the task and lists information
    const sourceListId = source.droppableId.split('-')[1];
    const destinationListId = destination.droppableId.split('-')[1];
    const taskId = draggableId.split('-')[1];

    try {
      // Create new lists array with updated task positions
      const newLists = [...lists];
      
      // Find source and destination list
      const sourceList = newLists.find(list => list.id === parseInt(sourceListId));
      const destinationList = newLists.find(list => list.id === parseInt(destinationListId));

      if (!sourceList || !destinationList) return;

      // Remove task from source list
      const [movedTask] = sourceList.tasks.splice(source.index, 1);
      
      // Add task to destination list
      destinationList.tasks.splice(destination.index, 0, movedTask);

      // Update the UI immediately
      setLists(newLists);

      // Send update to server
      await moveTask(taskId, parseInt(destinationListId), destination.index);
    } catch (err) {
      console.error('Error moving task:', err);
      // Reload lists to revert to the server state if there was an error
      const response = await getLists(boardId);
      setLists(response.data);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
            aria-label="back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component={RouterLink}
              to="/"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Dashboard
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {board?.title || 'Loading...'}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        backgroundColor: darkMode ? 'background.paper' : 'background.default',
        p: 2,
        borderRadius: 2,
        boxShadow: 1,
      }}>
        <Typography variant="h4" component="h1">
          {board?.title || 'Loading...'}
        </Typography>
        <Box>
          <IconButton 
            onClick={() => setChatOpen(!chatOpen)}
            sx={{ mr: 2 }}
            color={chatOpen ? 'primary' : 'default'}
          >
            <ChatIcon />
          </IconButton>
          <Button 
            variant="contained" 
            onClick={() => setNewListDialogOpen(true)}
            startIcon={<AddIcon />}
          >
            Add List
          </Button>
        </Box>
      </Box>

      <ChatPanel 
        boardId={boardId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2, gap: 2 }}>
          {lists.map((list) => (
            <Paper 
              key={list.id} 
              sx={{ 
                minWidth: 300,
                maxWidth: 300,
                bgcolor: darkMode ? 'background.paper' : 'grey.100',
                p: 2,
                borderRadius: 2,
                '& .MuiCard-root': {
                  bgcolor: darkMode ? 'background.default' : 'background.paper',
                },
                '& .MuiTypography-root': {
                  color: darkMode ? 'text.primary' : 'inherit',
                },
                boxShadow: darkMode 
                  ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 1,
                    fontWeight: 600,
                    color: darkMode ? 'text.primary' : 'text.primary',
                  }}
                >
                  {list.title}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedListId(list.id);
                    setNewTaskDialogOpen(true);
                  }}
                  sx={{
                    borderColor: darkMode ? 'primary.main' : 'inherit',
                    color: darkMode ? 'primary.main' : 'inherit',
                  }}
                >
                  Add Task
                </Button>
              </Box>
              
              <Droppable droppableId={`list-${list.id}`}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    style={{ minHeight: '100px' }}
                  >
                    {list.tasks && list.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={`task-${task.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ 
                              mb: 1,
                              bgcolor: darkMode ? 'background.paper' : 'background.default',
                              '&:hover': {
                                boxShadow: darkMode 
                                  ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                                  : '0 4px 8px rgba(0, 0, 0, 0.2)',
                              },
                              transition: 'box-shadow 0.2s ease-in-out',
                            }}
                            onClick={() => {
                              setSelectedTask(task);
                              setCommentsOpen(true);
                            }}
                          >
                            <CardContent>
                              <Typography 
                                variant="subtitle1"
                                sx={{ 
                                  color: darkMode ? 'text.primary' : 'inherit',
                                  fontWeight: 500,
                                }}
                              >
                                {task.title}
                              </Typography>
                              {task.description && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: darkMode ? 'text.secondary' : 'text.secondary',
                                    mt: 1,
                                  }}
                                >
                                  {task.description}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      {/* New List Dialog */}
      <Dialog open={newListDialogOpen} onClose={() => setNewListDialogOpen(false)}>
        <DialogTitle>Create New List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Title"
            fullWidth
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateList();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewListDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateList} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onClose={() => setNewTaskDialogOpen(false)}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={newTaskData.title}
            onChange={(e) =>
              setNewTaskData({ ...newTaskData, title: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTaskData.description}
            onChange={(e) =>
              setNewTaskData({ ...newTaskData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {selectedTask && (
        <TaskComments
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          open={commentsOpen}
          onClose={() => {
            setCommentsOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </Container>
  );
}

export default Board; 