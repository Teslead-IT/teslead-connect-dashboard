# Analytics API

Dashboard and task-list endpoints for org-level and user-level ("mine") analytics. All endpoints require **JWT authentication** and **organization context** (header `x-org-id` or org in token).

**Base URL:** `http://localhost:3021` (or your `PORT` / deployed host)

**Headers (all requests):**
- `Authorization: Bearer <access_token>` (required)
- `x-org-id: <organizationId>` (optional; if omitted, org from token is used)

---

## 1. Org-level dashboard (counts + chart data)

**GET** `http://localhost:3021/analytics/dashboard`

Returns aggregated counts and chart-ready arrays for the current org (projects, tasks, assignees, due buckets, time series).

### Request

- **Method:** GET  
- **Query params:** None  
- **Headers:** `Authorization`, `x-org-id` (optional)

### Response (200)

```json
{
  "overview": {
    "totalProjects": 5,
    "totalTasks": 42,
    "totalPhases": 8,
    "totalTaskLists": 12,
    "assignedUsersCount": 6,
    "tasksOverdue": 3,
    "tasksDueSoon": 7,
    "tasksDueToday": 2,
    "phasesEnded": 1,
    "phasesEndingSoon": 2,
    "tasksCompleted": 20,
    "tasksPending": 22
  },
  "projectsByStatus": [
    { "label": "IN_PROGRESS", "value": 3 },
    { "label": "NOT_STARTED", "value": 2 }
  ],
  "projectsByAccess": [
    { "label": "PUBLIC", "value": 1 },
    { "label": "PRIVATE", "value": 4 }
  ],
  "tasksByStatus": [
    { "label": "To Do", "value": 15 },
    { "label": "In Progress", "value": 12 },
    { "label": "Done", "value": 15 }
  ],
  "tasksByPriority": [
    { "label": "Low", "value": 10 },
    { "label": "Medium", "value": 20 },
    { "label": "High", "value": 12 }
  ],
  "tasksByAssignee": [
    { "label": "John Doe", "value": 12 },
    { "label": "Jane Smith", "value": 8 }
  ],
  "tasksByDueBucket": [
    { "label": "Overdue", "value": 3 },
    { "label": "Today", "value": 2 },
    { "label": "Next 7 days", "value": 7 },
    { "label": "Later", "value": 10 },
    { "label": "No due date", "value": 20 }
  ],
  "phaseEndingsByMonth": [
    { "period": "2025-02", "value": 0 },
    { "period": "2025-03", "value": 1 },
    { "period": "2025-04", "value": 2 }
  ],
  "taskDueCountByWeek": [
    { "period": "Week 1 (2025-02-20)", "value": 2 },
    { "period": "Week 2 (2025-02-27)", "value": 5 }
  ]
}
```

---

## 2. User-level "mine" dashboard (counts + chart data)

**GET** `http://localhost:3021/analytics/dashboard/mine`

Returns the current user’s stats within the current org: my projects, my assigned tasks, and chart data for "mine" only.

### Request

- **Method:** GET  
- **Query params:** None  
- **Headers:** `Authorization`, `x-org-id` (optional)

### Response (200)

```json
{
  "overview": {
    "myProjectsCount": 3,
    "myTasksAssigned": 15,
    "myTasksOverdue": 2,
    "myTasksDueSoon": 4,
    "myTasksDueToday": 1,
    "myTasksCompleted": 6,
    "myTasksPending": 9
  },
  "myTasksByStatus": [
    { "label": "To Do", "value": 5 },
    { "label": "In Progress", "value": 4 },
    { "label": "Done", "value": 6 }
  ],
  "myTasksByPriority": [
    { "label": "Medium", "value": 8 },
    { "label": "High", "value": 7 }
  ],
  "myTasksByDueBucket": [
    { "label": "Overdue", "value": 2 },
    { "label": "Today", "value": 1 },
    { "label": "Next 7 days", "value": 4 },
    { "label": "No due date", "value": 8 }
  ],
  "myTasksByProject": [
    { "label": "Project Alpha", "value": 8 },
    { "label": "Project Beta", "value": 7 }
  ]
}
```

---

## 3. Org-level task list (for list-in-card)

**GET** `http://localhost:3021/analytics/dashboard/task-lists`

Returns a list of **tasks** and a list of **projects** in the org. Tasks have full row data (project name, task name, status, due date, assignees, etc.), optionally filtered by due bucket. Projects include id, name, status, access, task counts (total, overdue, due soon).

### Request

- **Method:** GET  
- **Query params:**

| Param   | Type   | Default | Description |
|--------|--------|--------|-------------|
| `bucket` | string | `all` | `overdue` \| `due_soon` \| `due_today` \| `all` |
| `limit`  | number | `20`  | Max items (1–100) |

- **Headers:** `Authorization`, `x-org-id` (optional)

**Example:**  
`http://localhost:3021/analytics/dashboard/task-lists?bucket=overdue&limit=10`

### Response (200)

```json
{
  "items": [
    {
      "id": "clxx123abc",
      "title": "Fix login bug",
      "projectId": "clxx456def",
      "projectName": "Project Alpha",
      "statusName": "In Progress",
      "dueDate": "2025-02-18T00:00:00.000Z",
      "priority": 2,
      "priorityLabel": "High",
      "assignees": [
        { "id": "user-1", "name": "John Doe" }
      ],
      "phaseName": "Development",
      "taskListName": "Backend"
    }
  ],
  "total": 3,
  "projects": [
    {
      "id": "clxx456def",
      "name": "Project Alpha",
      "status": "IN_PROGRESS",
      "access": "PRIVATE",
      "taskCount": 12,
      "tasksOverdue": 2,
      "tasksDueSoon": 4
    }
  ]
}
```

- **items:** Array of task rows (length ≤ `limit`).  
- **total:** Total number of tasks matching the `bucket` in the org (for "show more" / pagination).  
- **projects:** Array of projects in the org; each has `id`, `name`, `status`, `access`, `taskCount`, `tasksOverdue`, `tasksDueSoon`.

---

## 4. User-level "mine" task list (for list-in-card)

**GET** `http://localhost:3021/analytics/dashboard/mine/task-lists`

Same shape as org task list: **tasks** (only those assigned to the current user) and **projects** (only projects the user is a member of), with task counts for "mine" tasks per project.

### Request

- **Method:** GET  
- **Query params:** Same as org task list

| Param   | Type   | Default | Description |
|--------|--------|--------|-------------|
| `bucket` | string | `all` | `overdue` \| `due_soon` \| `due_today` \| `all` |
| `limit`  | number | `20`  | Max items (1–100) |

**Example:**  
`http://localhost:3021/analytics/dashboard/mine/task-lists?bucket=due_soon&limit=15`

### Response (200)

Same shape as org task list: `items`, `total`, and `projects` (projects the user is a member of; counts are for tasks assigned to the user in that project).

```json
{
  "items": [
    {
      "id": "clxx789ghi",
      "title": "Review PR",
      "projectId": "clxx456def",
      "projectName": "Project Alpha",
      "statusName": "To Do",
      "dueDate": "2025-02-24T00:00:00.000Z",
      "priority": 1,
      "priorityLabel": "Medium",
      "assignees": [
        { "id": "user-1", "name": "John Doe" }
      ],
      "phaseName": "Development",
      "taskListName": "Backend"
    }
  ],
  "total": 4,
  "projects": [
    {
      "id": "clxx456def",
      "name": "Project Alpha",
      "status": "IN_PROGRESS",
      "access": "PRIVATE",
      "taskCount": 8,
      "tasksOverdue": 1,
      "tasksDueSoon": 3
    }
  ]
}
```

---

## 5. Org users (members in current org)

**GET** `http://localhost:3021/analytics/dashboard/users`

Returns a list of users/members in the current organization: profile (name, email), org role, membership status, joined date, and task breakdown (total assigned, completed, pending) in the org.

### Request

- **Method:** GET  
- **Query params:** None  
- **Headers:** `Authorization`, `x-org-id` (optional)

### Response (200)

```json
{
  "users": [
    {
      "userId": "clxx-user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "joinedAt": "2025-01-15T10:00:00.000Z",
      "tasksAssignedCount": 8,
      "tasksCompleted": 5,
      "tasksPending": 3
    },
    {
      "userId": "clxx-user-2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "MEMBER",
      "status": "ACTIVE",
      "joinedAt": "2025-02-01T14:30:00.000Z",
      "tasksAssignedCount": 3,
      "tasksCompleted": 1,
      "tasksPending": 2
    }
  ],
  "total": 2
}
```

- **users:** Array of org members. `userId` is null for invited users who have not accepted yet; `email` may come from the invite.  
- **total:** Total number of members (same as `users.length`).  
- **role:** `OWNER` | `ADMIN` | `MEMBER`.  
- **status:** `ACTIVE` | `INVITED` | `REJECTED`.  
- **tasksAssignedCount:** Total top-level tasks assigned to that user in this org (0 for INVITED/REJECTED).  
- **tasksCompleted:** Assigned tasks considered completed (status name matches done/complete).  
- **tasksPending:** Assigned tasks still pending (`tasksAssignedCount - tasksCompleted`).

---

## Error responses

- **401 Unauthorized:** Missing or invalid JWT.  
- **403 Forbidden:** No org context or user not in org (e.g. invalid `x-org-id`).  
- **400 Bad Request:** Invalid query (e.g. `bucket` not in allowed values, `limit` &lt; 1 or &gt; 100).

Example 400 body:

```json
{
  "message": ["bucket must be one of the following values: overdue, due_soon, due_today, all"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Summary table

| Purpose              | Full URL | Method | Query |
|----------------------|----------|--------|--------|
| Org dashboard        | `http://localhost:3021/analytics/dashboard` | GET | — |
| Mine dashboard       | `http://localhost:3021/analytics/dashboard/mine` | GET | — |
| Org task list        | `http://localhost:3021/analytics/dashboard/task-lists` | GET | `bucket`, `limit` |
| Mine task list       | `http://localhost:3021/analytics/dashboard/mine/task-lists` | GET | `bucket`, `limit` |
| Org users            | `http://localhost:3021/analytics/dashboard/users` | GET | — |

Replace `http://localhost:3021` with your actual API base URL in production.
