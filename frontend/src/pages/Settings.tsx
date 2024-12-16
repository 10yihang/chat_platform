import React from 'react';
import { Box, List, ListItem, ListItemText, Switch } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box>
      <List>
        <ListItem>
          <ListItemText primary="通知" />
          <Switch />
        </ListItem>
      </List>
    </Box>
  );
};

export default Settings;