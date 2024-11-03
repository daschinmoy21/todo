import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera } from '@mui/icons-material';
import { updateUserProfile, getUserProfile } from '../services/api';

function UserProfile({ open, onClose }) {
  const [profile, setProfile] = useState({
    username: '',
    user_info: '',
    profile_picture: '',
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      const response = await getUserProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(profile);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        User Profile
        {!editing && (
          <IconButton
            onClick={() => setEditing(true)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.profile_picture}
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            {editing && (
              <IconButton
                color="primary"
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'background.paper',
                }}
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                />
                <PhotoCamera />
              </IconButton>
            )}
          </Box>
          {editing ? (
            <>
              <TextField
                fullWidth
                label="Username"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={4}
                value={profile.user_info || ''}
                onChange={(e) => setProfile({ ...profile, user_info: e.target.value })}
              />
            </>
          ) : (
            <>
              <Typography variant="h6">{profile.username || 'No username set'}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {profile.user_info || 'No bio provided'}
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {editing ? (
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default UserProfile; 