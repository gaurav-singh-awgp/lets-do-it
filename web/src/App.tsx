import { TodoApp } from "./features/todos/TodoApp";

export default function App() {
  return (
    <main className="todo-shell">
      <h1>Todos</h1>
      <p className="todo-lead">Create, complete, and delete tasks.</p>
      <TodoApp />
    </main>
  );
}
