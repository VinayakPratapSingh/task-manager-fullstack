import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_URL, TASKS_URL } from "../config";

// Convert API responses into readable errors.
async function readResponse(response, fallbackMessage) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid response from the server. Please try again.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function getErrorMessage(error) {
  if (error instanceof TypeError) {
    return "Cannot connect to the backend. Check whether your server is running.";
  }

  return error.message || "Something went wrong. Please try again.";
}

function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch tasks from MongoDB through Express.
  async function fetchTasks() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(TASKS_URL, {
        credentials: "include",
      });

      const result = await readResponse(
        response,
        "Failed to fetch tasks."
      );

      setTasks(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  // Create a task.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(TASKS_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const result = await readResponse(
        response,
        "Could not create task."
      );

      setTasks((currentTasks) => [...currentTasks, result.data]);
      setTitle("");
      setDescription("");
      setMessage("Task created successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Toggle task completion.
  async function handleToggle(task) {
    if (updatingTaskId || deletingTaskId) return;

    setError("");
    setMessage("");

    try {
      setUpdatingTaskId(task.id);

      const response = await fetch(`${TASKS_URL}/${task.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      const result = await readResponse(
        response,
        "Could not update task."
      );

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id ? result.data : item
        )
      );

      setMessage("Task status updated!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  // Delete a task.
  async function handleDelete(id) {
    if (updatingTaskId || deletingTaskId) return;

    setError("");
    setMessage("");

    try {
      setDeletingTaskId(id);

      const response = await fetch(`${TASKS_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await readResponse(response, "Could not delete task.");

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== id)
      );

      setMessage("Task deleted successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingTaskId(null);
    }
  }

  // Logout the current user.
  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      const response = await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      await readResponse(response, "Could not logout.");

      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoggingOut(false);
    }
  }

  // Calculate task statistics.
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = totalTasks - completedTasks;

  // Filter tasks based on status and search.
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !task.completed) ||
      (filter === "completed" && task.completed);

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      task.title.toLowerCase().includes(searchText) ||
      (task.description || "").toLowerCase().includes(searchText);

    return matchesFilter && matchesSearch;
  });

  const taskActionsDisabled = Boolean(
    updatingTaskId || deletingTaskId
  );

  return (
    <main className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p>Your tasks, all in one place.</p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </header>

      <section className="stats-section">
        <div className="stat-card">
          <span>Total Tasks</span>
          <h2>{totalTasks}</h2>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <h2>{pendingTasks}</h2>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <h2>{completedTasks}</h2>
        </div>
      </section>

      <section className="form-section">
        <h2>Create a New Task</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Task title *</label>

          <input
            id="title"
            type="text"
            placeholder="e.g. Learn React"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            disabled={saving}
          />

          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            placeholder="Describe your task..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={3}
            disabled={saving}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      {error && (
        <div className="notice error">
          <p>{error}</p>

          {!loading && tasks.length === 0 && (
            <button type="button" onClick={fetchTasks}>
              Retry
            </button>
          )}
        </div>
      )}

      {message && <p className="notice success">{message}</p>}

      <section className="task-section">
        <div className="task-heading">
          <h2>My Tasks ({filteredTasks.length})</h2>

          <div className="filter-buttons">
            <button
              className={filter === "all" ? "filter-active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>

            <button
              className={filter === "pending" ? "filter-active" : ""}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>

            <button
              className={filter === "completed" ? "filter-active" : ""}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading && <p>Loading tasks from database...</p>}

        {!loading && !error && filteredTasks.length === 0 && (
          <p className="empty-message">
            {tasks.length === 0
              ? "No tasks yet. Create your first task above!"
              : "No matching tasks found."}
          </p>
        )}

        {!loading &&
          filteredTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-content">
                <h3 className={task.completed ? "task-title-done" : ""}>
                  {task.title}
                </h3>

                <p>{task.description || "No description"}</p>

                <span className={task.completed ? "completed" : "pending"}>
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </div>

              <div className="task-actions">
                <button
                  type="button"
                  className="complete-button"
                  onClick={() => handleToggle(task)}
                  disabled={taskActionsDisabled}
                >
                  {updatingTaskId === task.id
                    ? "Updating..."
                    : task.completed
                      ? "Undo"
                      : "Complete"}
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(task.id)}
                  disabled={taskActionsDisabled}
                >
                  {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

export default Dashboard;