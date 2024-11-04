/**
 * UserSettingsPanel Component
 * Handles user profile settings and updates
 */

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
import { PhotoCamera } from '@mui/icons-material';
import { getUserProfile, updateUserProfile } from '../services/api';

/**
 * Maximum allowed image size in bytes (5MB)
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * UserSettingsPanel Component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Handler for dialog close
 */
function UserSettingsPanel({ open, onClose }) {
  // State management
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

  // Load user profile when dialog opens
  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  /**
   * Loads user profile data from the server
   */
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

  /**
   * Handles image upload and processing
   * @param {Event} event - File input change event
   */
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    try {
      setImageLoading(true);
      const compressedImage = await compressImage(file);
      setProfile(prev => ({ ...prev, profile_picture: compressedImage }));
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    } finally {
      setImageLoading(false);
    }
  };

  /**
   * Compresses and converts image to base64
   * @param {File} file - Image file to compress
   * @returns {Promise<string>} Compressed image as base64 string
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let { width, height } = img;
          
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
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handles profile update submission
   */
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

  // Show loading spinner while initially loading profile
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
        {/* Error and success messages */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Profile form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          {/* Profile picture section */}
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

          {/* Form fields */}
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

      {/* Dialog actions */}
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