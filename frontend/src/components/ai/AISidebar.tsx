"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  ExpandLess, 
  ExpandMore, 
  History as HistoryIcon,
  ViewModule as TemplateIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { ChatSession } from '../../hooks/useAIChat';
import { Template } from '../../hooks/useTemplates';

interface AISidebarProps {
  templates: Template[];
  chatHistory: ChatSession[];
  onTemplateSelect: (template: Template) => void;
  onHistorySelect: (session: ChatSession) => void;
  onHistoryDelete?: (sessionId: string) => void;
  onTemplateFavorite?: (templateId: string) => void;
}

const templateCategories = [
  'Analysis',
  'Writing', 
  'Summarization',
  'Customer Service',
  'Business',
  'General'
];

export const AISidebar: React.FC<AISidebarProps> = ({
  templates,
  chatHistory,
  onTemplateSelect,
  onHistorySelect,
  onHistoryDelete,
  onTemplateFavorite
}) => {
  const [templatesExpanded, setTemplatesExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const favoriteTemplates = templates.filter(t => t.isFavorite);

  const getCategoryColor = (category: string) => {
    const colors = {
      'Analysis': 'primary',
      'Writing': 'secondary', 
      'Summarization': 'success',
      'Customer Service': 'warning',
      'Business': 'info',
      'General': 'default'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Paper className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full" elevation={0} square>
      {/* Templates Section */}
      <Box className="border-b border-gray-200 dark:border-gray-700">
        <ListItem 
          button 
          onClick={() => setTemplatesExpanded(!templatesExpanded)}
          className="border-b border-gray-100 dark:border-gray-700"
        >
          <TemplateIcon className="mr-2 text-blue-500" />
          <ListItemText 
            primary="Quick Templates" 
            primaryTypographyProps={{ 
              variant: 'subtitle1', 
              fontWeight: 'medium',
              className: 'text-gray-800 dark:text-gray-200'
            }} 
          />
          <Badge badgeContent={templates.length} color="primary" className="mr-2" />
          {templatesExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={templatesExpanded} timeout="auto" unmountOnExit>
          <Box className="p-2">
            {/* Category Filter */}
            <Box className="mb-2 flex flex-wrap gap-1">
              <Chip
                label="All"
                size="small"
                variant={selectedCategory === '' ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory('')}
                className="text-xs"
              />
              {templateCategories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  size="small"
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  onClick={() => setSelectedCategory(category)}
                  color={getCategoryColor(category) as any}
                  className="text-xs"
                />
              ))}
            </Box>

            {/* Favorite Templates */}
            {favoriteTemplates.length > 0 && selectedCategory === '' && (
              <>
                <Typography variant="caption" className="text-gray-500 px-2 block mb-1">
                  Favorites
                </Typography>
                <List dense>
                  {favoriteTemplates.map((template) => (
                    <ListItem
                      key={`fav-${template.id}`}
                      button
                      onClick={() => onTemplateSelect(template)}
                      className="mb-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 py-1"
                    >
                      <StarIcon className="text-yellow-500 mr-2" fontSize="small" />
                      <ListItemText
                        primary={truncateText(template.title, 25)}
                        primaryTypographyProps={{
                          className: "text-sm font-medium text-gray-900 dark:text-gray-100"
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider className="my-2" />
              </>
            )}

            {/* All Templates */}
            <List dense>
              {filteredTemplates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  onClick={() => onTemplateSelect(template)}
                  className="mb-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative group"
                >
                  <ListItemText
                    primary={truncateText(template.title)}
                    secondary={
                      <Box className="flex items-center justify-between">
                        <Chip 
                          label={template.category} 
                          size="small" 
                          variant="outlined"
                          color={getCategoryColor(template.category) as any}
                          className="text-xs h-5"
                        />
                      </Box>
                    }
                    primaryTypographyProps={{
                      className: "text-sm font-medium text-gray-900 dark:text-gray-100"
                    }}
                  />
                  {onTemplateFavorite && (
                    <Tooltip title={template.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTemplateFavorite(template.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {template.isFavorite ? 
                          <StarIcon fontSize="small" className="text-yellow-500" /> : 
                          <StarBorderIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </Box>

      {/* Chat History Section */}
      <Box className="flex-1 flex flex-col">
        <ListItem 
          button 
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="border-b border-gray-100 dark:border-gray-700"
        >
          <HistoryIcon className="mr-2 text-green-500" />
          <ListItemText 
            primary="Recent Sessions" 
            primaryTypographyProps={{ 
              variant: 'subtitle1', 
              fontWeight: 'medium',
              className: 'text-gray-800 dark:text-gray-200'
            }} 
          />
          <Badge badgeContent={chatHistory.length} color="secondary" className="mr-2" />
          {historyExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={historyExpanded} timeout="auto" unmountOnExit className="flex-1">
          <Box className="flex-1 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <Box className="p-4 text-center">
                <Typography variant="body2" className="text-gray-500">
                  No chat history yet.
                  <br />
                  Start a conversation!
                </Typography>
              </Box>
            ) : (
              <List dense>
                {chatHistory.map((session) => (
                  <ListItem
                    key={session.id}
                    button
                    onClick={() => onHistorySelect(session)}
                    className="mb-1 mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative group"
                  >
                    <ListItemText
                      primary={truncateText(session.title)}
                      secondary={
                        <Box className="flex items-center justify-between">
                          <span>{formatDate(session.createdAt)}</span>
                          <Badge 
                            badgeContent={session.messages.length} 
                            color="primary" 
                            size="small"
                          />
                        </Box>
                      }
                      primaryTypographyProps={{
                        className: "text-sm font-medium text-gray-900 dark:text-gray-100"
                      }}
                      secondaryTypographyProps={{
                        className: "text-xs text-gray-500 dark:text-gray-400"
                      }}
                    />
                    {onHistoryDelete && (
                      <Tooltip title="Delete session">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onHistoryDelete(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};
