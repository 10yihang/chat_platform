import { Box, Container, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

const Introduction = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h3" gutterBottom align="center">
                        欢迎使用聊天平台
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                        主要功能：
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText primary="实时聊天：支持用户之间的即时通讯" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="在线状态：查看其他用户的在线状态" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="好友系统：添加好友，管理好友列表" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="个人资料：自定义您的个人信息" />
                        </ListItem>
                    </List>

                    <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                        技术特点：
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText primary="基于 React 和 TypeScript 开发的现代化前端" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="使用 WebSocket 实现实时通讯" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Material-UI 组件库提供精美的用户界面" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="完善的用户认证和授权机制" />
                        </ListItem>
                    </List>

                    <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                        声明：
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText primary="主要是为了完成Python大作业" style={{ color: 'red' }} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="仅供学习和交流使用" style={{ color: 'red' }} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="完成时间较短，仍有许多问题和不足" style={{ color: 'red' }} />
                        </ListItem>
                    </List>

                    <Typography variant="body1" sx={{ mt: 4 }} align="center">
                        开始探索聊天平台，与好友保持联系！
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Introduction;
