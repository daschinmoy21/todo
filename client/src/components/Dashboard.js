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
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import { getBoards, createBoard, getUserProfile, deleteBoard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { AccountCircle } from '@mui/icons-material';
import UserSettingsPanel from './UserSettingsPanel';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const loadUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUserProfile(response.data);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  useEffect(() => {
    loadBoards();
    loadUserProfile();
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
      setBoards(prevBoards => [
        {
          ...response.data,
          role: 'owner'
        },
        ...prevBoards
      ]);
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

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBoard(boardId);
      setBoards(boards.filter(board => board.id !== boardId));
    } catch (err) {
      console.error('Error deleting board:', err);
      setError('Failed to delete board');
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={toggleDarkMode}
            sx={{
              mr: 2,
              backgroundColor: darkMode ? 'background.default' : 'background.paper',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: darkMode ? 'background.default' : 'background.paper',
                transform: 'rotate(180deg)',
              },
            }}
          >
            {darkMode ? (
              <LightModeIcon sx={{ color: 'primary.main' }} />
            ) : (
              <DarkModeIcon sx={{ color: 'primary.main' }} />
            )}
          </IconButton>
          <IconButton
            onClick={() => setProfileOpen(true)}
            sx={{ 
              mr: 2,
              width: 40,
              height: 40,
            }}
            color="inherit"
          >
            {userProfile?.profile_picture ? (
              <Avatar 
                src={userProfile.profile_picture}
                sx={{ 
                  width: 40, 
                  height: 40,
                  border: '2px solid',
                  borderColor: 'primary.main' 
                }}
              >
                {userProfile.username?.[0]?.toUpperCase()}
              </Avatar>
            ) : (
              <AccountCircle sx={{ width: 32, height: 32 }} />
            )}
          </IconButton>
          <Button 
            variant="contained" 
            onClick={() => setOpen(true)} 
            sx={{ mr: 2 }}
            startIcon={<AddIcon />}
          >
            Create New Board
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleLogout}
            sx={{
              borderColor: darkMode ? 'primary.main' : 'inherit',
              color: darkMode ? 'primary.main' : 'inherit',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.08)' : undefined,
              },
            }}
          >
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">{board.title}</Typography>
                  <Chip 
                    label={board.role}
                    size="small"
                    color={board.role === 'owner' ? 'primary' : board.role === 'admin' ? 'secondary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(board.created_at).toLocaleDateString()}
                </Typography>
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
                {board.role === 'owner' && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteBoard(board.id)}
                  >
                    Delete
                  </Button>
                )}
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

      <UserSettingsPanel
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          loadUserProfile();
        }}
      />
    </Container>
  );
}

export default Dashboard; 