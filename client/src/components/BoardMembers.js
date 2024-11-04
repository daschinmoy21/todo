/**
 * BoardMembers Component
 * Handles board member management including adding, removing, and role updates
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  getBoardMembers,
  addBoardMember,
  removeBoardMember,
  updateBoardMemberRole,
  searchUsers,
} from '../services/api';

/**
 * BoardMembers Component
 * @param {Object} props - Component props
 * @param {string} props.boardId - ID of the board
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Handler for dialog close
 * @param {string} props.userRole - Current user's role in the board
 */
function BoardMembers({ boardId, open, onClose, userRole }) {
  // State management
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Load members when dialog opens
  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, boardId]);

  /**
   * Loads board members
   */
  const loadMembers = async () => {
    try {
      const response = await getBoardMembers(boardId);
      setMembers(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load board members');
    }
  };

  /**
   * Handles user search
   * @param {string} email - Email to search for
   */
  const handleSearch = async (email) => {
    setNewMemberEmail(email);
    if (email.length > 2) {
      try {
        const response = await searchUsers(email);
        setSearchResults(response.data);
        setError('');
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      }
    } else {
      setSearchResults([]);
    }
  };

  /**
   * Handles adding a new member
   * @param {string} userId - ID of the user to add
   */
  const handleAddMember = async (userId) => {
    try {
      await addBoardMember(boardId, userId, selectedRole);
      setSuccess('Member added successfully');
      setNewMemberEmail('');
      setSelectedRole('member');
      setSearchResults([]);
      await loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  /**
   * Handles removing a member
   * @param {string} userId - ID of the user to remove
   */
  const handleRemoveMember = async (userId) => {
    try {
      await removeBoardMember(boardId, userId);
      await loadMembers();
      setError('');
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
    }
  };

  /**
   * Handles role updates
   * @param {string} userId - ID of the user
   * @param {string} newRole - New role to assign
   */
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateBoardMemberRole(boardId, userId, newRole);
      await loadMembers();
      setError('');
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    }
  };

  const canManageMembers = userRole === 'owner' || userRole === 'admin';
  const canChangeRoles = userRole === 'owner';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Board Members</DialogTitle>
      <DialogContent>
        {/* Error and success messages */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Add member section */}
        {canManageMembers && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Member</Typography>
            <TextField
              fullWidth
              label="Search by email or username"
              value={newMemberEmail}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            {searchResults.length > 0 && (
              <List>
                {searchResults.map((user) => (
                  <ListItem key={user.id}>
                    <ListItemAvatar>
                      <Avatar src={user.profile_picture}>
                        {user.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.username} 
                      secondary={user.email}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddMember(user.id)}
                    >
                      Add
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Members list */}
        <Typography variant="h6" sx={{ mb: 2 }}>Current Members</Typography>
        <List>
          {members.map((member) => (
            <ListItem key={member.user_id}>
              <ListItemAvatar>
                <Avatar src={member.profile_picture}>
                  {member.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={member.username}
                secondary={member.role}
              />
              {canChangeRoles && member.role !== 'owner' && (
                <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                  <Select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="member">Member</MenuItem>
                  </Select>
                </FormControl>
              )}
              {canManageMembers && member.role !== 'owner' && (
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveMember(member.user_id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BoardMembers; 