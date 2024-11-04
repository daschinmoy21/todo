/**
 * Board Component
 * Handles individual board view with lists, tasks, and drag-and-drop functionality
 */

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
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

// Import components and services
import { 
  createList, 
  createTask, 
  getLists, 
  getBoard, 
  moveTask, 
  moveList 
} from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import ChatPanel from './ChatPanel';
import TaskComments from './TaskComments';
import BoardMembers from './BoardMembers';

/**
 * Board Component
 * @component
 */
function Board() {
  // State management
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Hooks
  const { id: boardId } = useParams();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // Load initial data
  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  /**
   * Loads board data and lists
   */
  const loadBoardData = async () => {
    try {
      const [boardResponse, listsResponse] = await Promise.all([
        getBoard(boardId),
        getLists(boardId)
      ]);
      setBoard(boardResponse.data);
      setLists(listsResponse.data);
      setUserRole(boardResponse.data.role);
    } catch (err) {
      console.error('Error loading board data:', err);
      if (err.response?.status === 404) {
        navigate('/');
      }
    }
  };

  /**
   * Handles list creation
   */
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

  /**
   * Handles task creation
   */
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

  /**
   * Handles drag and drop functionality
   * @param {Object} result - Drag and drop result object
   */
  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle list reordering
    if (type === 'list') {
      try {
        const newLists = Array.from(lists);
        const [movedList] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, movedList);

        const updatedLists = newLists.map((list, index) => ({
          ...list,
          position: index,
        }));

        setLists(updatedLists);
        await moveList(draggableId.split('-')[1], destination.index, boardId);
      } catch (err) {
        console.error('Error moving list:', err);
        const response = await getLists(boardId);
        setLists(response.data);
      }
      return;
    }

    // Handle task movement
    const sourceListId = source.droppableId.split('-')[1];
    const destinationListId = destination.droppableId.split('-')[1];
    const taskId = draggableId.split('-')[1];

    try {
      const newLists = [...lists];
      
      const sourceList = newLists.find(list => list.id === parseInt(sourceListId));
      const destinationList = newLists.find(list => list.id === parseInt(destinationListId));

      if (!sourceList || !destinationList) return;

      const [movedTask] = sourceList.tasks.splice(source.index, 1);
      destinationList.tasks.splice(destination.index, 0, movedTask);

      setLists(newLists);
      await moveTask(taskId, parseInt(destinationListId), destination.index);
    } catch (err) {
      console.error('Error moving task:', err);
      const response = await getLists(boardId);
      setLists(response.data);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Navigation */}
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

      {/* Board header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">{board?.title}</Typography>
        <Box>
          {(userRole === 'owner' || userRole === 'admin') && (
            <IconButton 
              onClick={() => setMembersDialogOpen(true)}
              sx={{ mr: 2 }}
            >
              <GroupIcon />
            </IconButton>
          )}
          <IconButton 
            onClick={() => setChatOpen(!chatOpen)}
            sx={{ mr: 2 }}
          >
            <ChatIcon />
          </IconButton>
          {userRole && (
            <Button 
              variant="contained" 
              onClick={() => setNewListDialogOpen(true)}
              startIcon={<AddIcon />}
            >
              Add List
            </Button>
          )}
        </Box>
      </Box>

      {/* Board components */}
      <BoardMembers
        boardId={boardId}
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        userRole={userRole}
      />

      <ChatPanel 
        boardId={boardId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Drag and drop context */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="lists" direction="horizontal" type="list">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ display: 'flex', overflowX: 'auto', pb: 2, gap: 2 }}
            >
              {lists.map((list, index) => (
                <Draggable
                  key={list.id}
                  draggableId={`list-${list.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Paper
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        minWidth: 300,
                        maxWidth: 300,
                        bgcolor: darkMode ? 'background.paper' : 'grey.100',
                        p: 2,
                        borderRadius: 2,
                        opacity: snapshot.isDragging ? 0.9 : 1,
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
                      {/* List header */}
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
                      
                      {/* Tasks */}
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {/* Dialogs */}
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