import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CirclePicker,
} from '@mui/material';
import { Label as LabelIcon, Add as AddIcon } from '@mui/icons-material';
import { createLabel, getLabels, addLabelToTask, removeLabelFromTask } from '../services/api';

function TaskLabels({ taskId, boardId, existingLabels = [] }) {
  const [labels, setLabels] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#1976d2' });

  useEffect(() => {
    loadLabels();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      const response = await getLabels(boardId);
      setLabels(response.data);
    } catch (err) {
      console.error('Error loading labels:', err);
    }
  };

  const handleCreateLabel = async () => {
    try {
      await createLabel(boardId, newLabel.name, newLabel.color);
      setCreateDialogOpen(false);
      setNewLabel({ name: '', color: '#1976d2' });
      loadLabels();
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleAddLabel = async (labelId) => {
    try {
      await addLabelToTask(taskId, labelId);
      loadLabels();
    } catch (err) {
      console.error('Error adding label:', err);
    }
    setAnchorEl(null);
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await removeLabelFromTask(taskId, labelId);
      loadLabels();
    } catch (err) {
      console.error('Error removing label:', err);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
        {existingLabels.map((label) => (
          <Chip
            key={label.id}
            label={label.name}
            size="small"
            style={{ backgroundColor: label.color, color: '#fff' }}
            onDelete={() => handleRemoveLabel(label.id)}
          />
        ))}
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <LabelIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {labels.map((label) => (
          <MenuItem
            key={label.id}
            onClick={() => handleAddLabel(label.id)}
            disabled={existingLabels.some(l => l.id === label.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: label.color,
                }}
              />
              <Typography>{label.name}</Typography>
            </Box>
          </MenuItem>
        ))}
        <MenuItem onClick={() => {
          setAnchorEl(null);
          setCreateDialogOpen(true);
        }}>
          <AddIcon fontSize="small" sx={{ mr: 1 }} />
          Create new label
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Label</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Label Name"
            fullWidth
            value={newLabel.name}
            onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
          />
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Color</Typography>
            <CirclePicker
              color={newLabel.color}
              onChange={(color) => setNewLabel({ ...newLabel, color: color.hex })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateLabel} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TaskLabels; 