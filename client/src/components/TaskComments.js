/**
 * TaskComments Component
 * Handles comments functionality for individual tasks
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { getTaskComments, createTaskComment } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * TaskComments Component
 * @param {Object} props - Component props
 * @param {string} props.taskId - ID of the task
 * @param {string} props.taskTitle - Title of the task
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Handler for dialog close
 */
function TaskComments({ taskId, taskTitle, open, onClose }) {
  // State management
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Load comments when dialog opens
  useEffect(() => {
    if (open && taskId) {
      loadComments();
    }
  }, [open, taskId]);

  /**
   * Loads comments for the task
   */
  const loadComments = async () => {
    try {
      const response = await getTaskComments(taskId);
      setComments(response.data);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  /**
   * Handles adding a new comment
   */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createTaskComment(taskId, newComment.trim());
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Comments</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {taskTitle}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          {/* Comments list */}
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {comments.map((comment) => (
              <React.Fragment key={comment.comment_id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={comment.profile_picture} alt={comment.username}>
                      {comment.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">{comment.username}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.comment_text}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>

          {/* Comment input */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.paper' }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskComments; 