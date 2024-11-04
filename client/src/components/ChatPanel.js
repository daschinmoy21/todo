/**
 * ChatPanel Component
 * Provides real-time chat functionality for board members
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Drawer,
  Alert,
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { io } from 'socket.io-client';
import { getBoardMessages } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function ChatPanel({ boardId, open, onClose }) {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const { token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    console.log('Initializing socket connection...');
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      auth: { token }
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setError('');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat');
    });

    setSocket(newSocket);

    // Cleanup socket connection on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      if (newSocket) newSocket.close();
    };
  }, [token]);

  // Handle board-specific socket events
  useEffect(() => {
    if (!socket || !boardId) return;

    console.log('Setting up message listeners for board:', boardId);
    
    socket.emit('join-board', boardId);
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    // Load existing messages
    loadMessages();

    return () => {
      console.log('Cleaning up message listeners');
      socket.emit('leave-board', boardId);
      socket.off('new-message');
    };
  }, [socket, boardId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Loads existing messages from the server
   */
  const loadMessages = async () => {
    try {
      const response = await getBoardMessages(boardId);
      setMessages(response.data);
      // Scroll to bottom after loading messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  /**
   * Handles sending a new message
   */
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    console.log('Sending message:', {
      boardId,
      message: newMessage.trim()
    });

    socket.emit('board-message', {
      boardId,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: 340,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 340,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Chat header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Board Chat</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Messages list */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <List>
          {messages.map((message) => (
            <ListItem key={message.chat_message_id} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar src={message.profile_picture} alt={message.username}>
                  {message.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">
                      {message.username || 'Anonymous'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      mt: 0.5
                    }}
                  >
                    {message.message_text}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message input */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          multiline
          maxRows={4}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Drawer>
  );
}

export default ChatPanel;