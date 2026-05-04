import { TodoRepository } from "../repositories/todo.repository.js";
import type { TodoDto } from "../lib/mapTodo.js";
import { mapTodoToDto } from "../lib/mapTodo.js";
import type { CreateTodoBody, PatchTodoBody } from "../schemas/todo.zod.js";

export class TodoService {
  constructor(private readonly repo: TodoRepository) {}

  async listTodos(): Promise<TodoDto[]> {
    const rows = await this.repo.list();
    return rows.map(mapTodoToDto);
  }

  async createTodo(body: CreateTodoBody): Promise<TodoDto> {
    const row = await this.repo.insert({
      text: body.text,
      done: false,
    });
    return mapTodoToDto(row);
  }

  async patchTodo(id: string, body: PatchTodoBody): Promise<TodoDto | null> {
    const existing = await this.repo.findById(id);
    if (!existing) return null;
    const row = await this.repo.updateDone(id, body.done);
    return row ? mapTodoToDto(row) : null;
  }

  async deleteTodo(id: string): Promise<boolean> {
    return this.repo.deleteById(id);
  }
}
