import React, { useState } from 'react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [value, setValue] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return; // ignore empty / whitespace-only
    setTasks((prev) => [...prev, { id: Date.now() + Math.random(), text: trimmed, done: false }]);
    setValue('');
  };

  const toggle = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const remove = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app">
      <h1>To-Do List</h1>

      <form onSubmit={addTask}>
        <input
          type="text"
          placeholder="Enter a task"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <p className="counter">Total tasks: {tasks.length}</p>

      {tasks.length === 0 ? (
        <p className="empty">No tasks yet. Add one above.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className={task.done ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggle(task.id)}
              />
              <span className="task-text">{task.text}</span>
              <button className="delete" onClick={() => remove(task.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
