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
  Alert,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera, Edit } from '@mui/icons-material';
import { getUserProfile, updateUserProfile } from '../services/api';

function UserSettingsPanel({ open, onClose }) {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    profile_picture: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      setProfile(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    try {
      setImageLoading(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          setProfile(prev => ({ ...prev, profile_picture: compressedBase64 }));
          setImageLoading(false);
        };
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.username?.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(profile);
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile.username) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>User Settings</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            {imageLoading ? (
              <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Avatar
                src={profile.profile_picture}
                sx={{ 
                  width: 100, 
                  height: 100,
                  border: '2px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
            <IconButton
              color="primary"
              component="label"
              sx={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: 'background.paper',
                },
              }}
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageUpload}
                disabled={loading}
              />
              <PhotoCamera />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            label="Username"
            value={profile.username || ''}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            sx={{ mb: 2 }}
            disabled={loading}
            required
          />

          <TextField
            fullWidth
            label="Email"
            value={profile.email || ''}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserSettingsPanel; 