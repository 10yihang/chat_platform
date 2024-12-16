import React from 'react';
import { Box, Card, Avatar, Typography } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Card sx={{ p: 3 }}>
        <Avatar sx={{ width: 100, height: 100 }} />
        <Typography variant="h6">个人资料</Typography>
      </Card>
    </Box>
  );
};

export default Profile;