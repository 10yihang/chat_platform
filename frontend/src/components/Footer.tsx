import { Box, Typography, Link, Stack } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        textAlign: 'center',
        py: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center" 
        justifyContent="center"
      >
        <Typography variant="body2" color="text.secondary">
          powered by yihang_01
        </Typography>
        <Link 
          href="https://github.com/10yihang/chat_platform" 
          target="_blank" 
          rel="noopener noreferrer"
          color="inherit"
        >
          <GitHubIcon sx={{ fontSize: 20 }} />
        </Link>
      </Stack>
    </Box>
  );
};

export default Footer;
