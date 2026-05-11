import { ListShell } from "./components/ListShell";
import { TodoApp } from "./features/todos/TodoApp";

export default function App() {
  return (
    <ListShell>
      <TodoApp />
    </ListShell>
  );
}
