# MLR-Hack Student Portal - Frontend

A React-based student portal with Redux Toolkit and RTK Query for state management.

## Tech Stack

- **React 19.2.0** - UI framework with lazy loading for code-splitting
- **Vite 7.2.4** - Build tool with manual chunks for optimized bundles
- **Redux Toolkit 2.11.1** - State management
- **RTK Query** - Data fetching and caching
- **Tailwind CSS 4.1.17** - Styling
- **Vitest** - Testing framework

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks
├── pages/             # Page components (lazy-loaded)
├── services/          # RTK Query API definitions
├── store/             # Redux store and slices
│   ├── slices/        # Redux slices (auth, ui)
│   └── index.js       # Store configuration
├── test/              # Test files
└── utils/             # Utility functions
```

## State Management with Redux Toolkit

### Store Structure

```javascript
{
  auth: {
    user: { ... } | null,     // Current user object
    token: string | null,     // JWT token
  },
  ui: {
    loadingOverlay: {
      isVisible: boolean,
      message: string,
    },
    toasts: [...],            // Toast notification queue
    sidebar: {
      isOpen: boolean,
      isMobileOpen: boolean,
    },
    modal: {
      isOpen: boolean,
      modalType: string | null,
      modalProps: object,
    },
  },
  api: { ... }               // RTK Query cache (auto-managed)
}
```

### Using RTK Query Hooks

**Fetching Data:**

```javascript
import { useGetUsersQuery } from '../services/api';

function UserList() {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {users?.map(user => <li key={user._id}>{user.name}</li>)}
    </ul>
  );
}
```

**Mutations with Optimistic Updates:**

```javascript
import { useDeleteUserMutation } from '../services/api';
import { useAppDispatch } from '../store';
import { showSuccessToast, showErrorToast } from '../store/slices/uiSlice';

function DeleteButton({ userId }) {
  const dispatch = useAppDispatch();
  const [deleteUser, { isLoading }] = useDeleteUserMutation();

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      dispatch(showSuccessToast('User deleted successfully'));
    } catch (err) {
      dispatch(showErrorToast(err.message || 'Failed to delete user'));
    }
  };

  return (
    <button onClick={handleDelete} disabled={isLoading}>
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### Migration Guide: From axios to RTK Query

**Before (axios):**

```javascript
import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../utils/api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };
  // ...
}
```

**After (RTK Query):**

```javascript
import { useGetUsersQuery, useDeleteUserMutation } from '../services/api';
import { useAppDispatch } from '../store';
import { showSuccessToast, showErrorToast } from '../store/slices/uiSlice';

function AdminUsers() {
  const dispatch = useAppDispatch();
  const { data: users = [], isLoading, error } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();

  const handleDelete = async (id) => {
    try {
      await deleteUser(id).unwrap();
      dispatch(showSuccessToast('User deleted'));
    } catch (err) {
      dispatch(showErrorToast(err.message));
    }
  };
  // ...
}
```

### Available API Hooks

**Users:**
- `useGetUsersQuery()` - Get all users
- `useGetUserByIdQuery(id)` - Get user by ID
- `useCreateUserMutation()` - Create new user
- `useUpdateUserMutation()` - Update user
- `useDeleteUserMutation()` - Delete user

**Students:**
- `useGetStudentsQuery()` - Get all students
- `useGetStudentByIdQuery(id)` - Get student by ID
- `useSearchStudentsQuery(params)` - Search students
- `useBulkImportStudentsMutation()` - Bulk import

**Courses:**
- `useGetCoursesQuery()` - Get all courses
- `useGetStudentCoursesQuery(studentId)` - Get student's courses
- `useEnrollInCourseMutation()` - Enroll in course

**Exams:**
- `useGetExamsQuery()` - Get all exams
- `useGetExamByIdQuery(id)` - Get exam details
- `useSubmitExamMutation()` - Submit exam answers

**Placements:**
- `useGetPlacementsQuery()` - Get placements
- `useCreatePlacementMutation()` - Create placement (optimistic)
- `useApplyToPlacementMutation()` - Apply to placement

**Notifications:**
- `useGetNotificationsQuery()` - Get notifications
- `useMarkNotificationReadMutation()` - Mark as read (optimistic)

See [src/services/api.js](src/services/api.js) for the complete list.

### Toast Notifications

```javascript
import { useAppDispatch } from '../store';
import { showSuccessToast, showErrorToast, showInfoToast } from '../store/slices/uiSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const handleSuccess = () => {
    dispatch(showSuccessToast('Operation completed!'));
  };

  const handleError = () => {
    dispatch(showErrorToast('Something went wrong'));
  };

  const handleInfo = () => {
    dispatch(showInfoToast('Did you know?', 10000)); // 10 second duration
  };
}
```

### Loading Overlay

```javascript
import { useAppDispatch } from '../store';
import { showLoading, hideLoading } from '../store/slices/uiSlice';

async function handleHeavyOperation() {
  dispatch(showLoading('Processing...'));
  try {
    await performOperation();
  } finally {
    dispatch(hideLoading());
  }
}
```

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('works with preloaded state', () => {
    renderWithProviders(<MyComponent />, {
      preloadedState: {
        auth: { user: { name: 'Test' }, token: 'abc' },
      },
    });
    expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
  });
});
```

## Performance Optimizations

- **Code Splitting**: All page components are lazy-loaded with `React.lazy()`
- **Bundle Splitting**: Vendor libraries split into separate chunks
- **RTK Query Caching**: Automatic request deduplication and caching
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Memoization**: Key components use `React.memo()` for render optimization

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API` | Backend API base URL | `/api` |

## Contributing

1. Use RTK Query hooks instead of direct axios calls
2. Add PropTypes to all components
3. Write tests for new components and slices
4. Use toast notifications for user feedback
5. Follow existing code patterns
