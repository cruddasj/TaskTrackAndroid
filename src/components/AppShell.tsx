import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { BottomNavigation, BottomNavigationAction, Box, Paper, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlined /> },
  { label: 'Tasks', path: '/tasks', icon: <ListAltOutlined /> },
  { label: 'Rounds', path: '/rounds', icon: <TimerOutlined /> },
  { label: 'Insights', path: '/insights', icon: <InsightsOutlined /> },
];

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const current = tabs.find((tab) => tab.path === location.pathname)?.path ?? false;

  return (
    <Box minHeight="100dvh" bgcolor="background.default" pb={10}>
      <Box px={{ xs: 2, md: 4 }} py={3}>
        <Typography variant="h5" color="primary.main" fontWeight={800}>
          TaskTrack
        </Typography>
      </Box>
      <Box px={{ xs: 2, md: 4 }}>
        <Outlet />
      </Box>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: '#121212' }} elevation={0}>
        <BottomNavigation
          value={current}
          onChange={(_, next) => navigate(next)}
          showLabels
          sx={{ bgcolor: 'transparent', height: 72 }}
        >
          {tabs.map((tab) => (
            <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
