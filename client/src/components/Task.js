/**
 * Task Component
 * Represents an individual task card with drag and drop functionality
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import { Draggable } from 'react-beautiful-dnd';
import {
  Comment as CommentIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import TaskLabels from './TaskLabels';

/**
 * Task Component
 * @param {Object} props - Component props
 * @param {Object} props.task - Task data
 * @param {number} props.index - Task position in list
 * @param {string} props.boardId - ID of the parent board
 * @param {Function} props.onTaskClick - Handler for task click
 * @param {boolean} props.darkMode - Current theme mode
 */
function Task({ task, index, boardId, onTaskClick, darkMode }) {
  const hasComments = task.comments_count > 0;
  const isPastDue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTaskClick(task)}
          sx={{
            mb: 1,
            bgcolor: darkMode ? 'background.paper' : 'background.default',
            opacity: snapshot.isDragging ? 0.9 : 1,
            transform: snapshot.isDragging ? 'rotate(3deg)' : 'none',
            '&:hover': {
              boxShadow: darkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                : '0 4px 8px rgba(0, 0, 0, 0.2)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <CardContent>
            {/* Labels */}
            <TaskLabels 
              taskId={task.id}
              boardId={boardId}
              existingLabels={task.labels}
            />

            {/* Task title */}
            <Typography 
              variant="subtitle1"
              sx={{ 
                color: darkMode ? 'text.primary' : 'inherit',
                fontWeight: 500,
                mb: 1,
              }}
            >
              {task.title}
            </Typography>

            {/* Task description */}
            {task.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'text.secondary' : 'text.secondary',
                  mb: 2,
                }}
              >
                {task.description}
              </Typography>
            )}

            {/* Task metadata */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {/* Due date */}
              {task.due_date && (
                <Chip
                  icon={<AccessTimeIcon />}
                  label={formatDistanceToNow(new Date(task.due_date), { 
                    addSuffix: true 
                  })}
                  size="small"
                  color={isPastDue ? 'error' : 'default'}
                  sx={{ mr: 1 }}
                />
              )}

              {/* Comments indicator */}
              {hasComments && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small">
                    <CommentIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {task.comments_count}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Assignee */}
            {task.assignee && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Assigned to: {task.assignee.username}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

export default Task; 