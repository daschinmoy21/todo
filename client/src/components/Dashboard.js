import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import { getBoards, createBoard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await getBoards();
      setBoards(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading boards:', err);
      setError('Failed to load boards');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    
    try {
      const response = await createBoard(newBoardTitle);
      setBoards([response.data, ...boards]);
      setOpen(false);
      setNewBoardTitle('');
    } catch (err) {
      console.error('Error creating board:', err);
      setError('Failed to create board');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Typography 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'text.primary',
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Dashboard
          </Typography>
        </Breadcrumbs>
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
        <Typography variant="h4" component="h1">My Boards</Typography>
        <Box>
          <Button 
            variant="contained" 
            onClick={() => setOpen(true)} 
            sx={{ mr: 2 }}
            startIcon={<AddIcon />}
          >
            Create New Board
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {boards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{board.title}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={`/board/${board.id}`}
                  size="small"
                  color="primary"
                >
                  Open Board
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board Title"
            fullWidth
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateBoard();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBoard} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Dashboard; 