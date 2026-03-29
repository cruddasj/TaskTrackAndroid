import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Button, Card, CardContent, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';

export const SettingsScreen = () => {
  const { state, setUserName, addCategory, deleteCategory } = useAppState();
  const [name, setName] = useState(state.userName);
  const [newCategory, setNewCategory] = useState('');

  const needsName = !state.userName.trim();
  const categoryExists = useMemo(
    () => state.categories.some((category) => category.toLowerCase() === newCategory.trim().toLowerCase()),
    [newCategory, state.categories],
  );

  return (
    <Stack spacing={3} pb={2}>
      <Box>
        <Typography variant="h3">Settings</Typography>
        <Typography color="text.secondary">
          {needsName
            ? 'Welcome! Please set your name to continue using the app.'
            : 'Manage your profile and task categories.'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Your name</Typography>
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus={needsName}
            />
            <Button
              variant="contained"
              onClick={() => setUserName(name.trim())}
              disabled={!name.trim()}
            >
              Save name
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Task categories</Typography>
            {state.categories.map((category) => (
              <Stack key={category} direction="row" alignItems="center" justifyContent="space-between">
                <Typography>{category}</Typography>
                <IconButton
                  aria-label={`delete-${category}`}
                  onClick={() => deleteCategory(category)}
                  disabled={state.categories.length <= 1}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                label="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                error={!!newCategory.trim() && categoryExists}
                helperText={categoryExists ? 'Category already exists' : ' '}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  const category = newCategory.trim();
                  if (!category || categoryExists) return;
                  addCategory(category);
                  setNewCategory('');
                }}
                disabled={!newCategory.trim() || categoryExists}
              >
                Add
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
