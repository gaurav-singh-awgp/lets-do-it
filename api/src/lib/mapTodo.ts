import type { TodoRow } from "../db/schema.js";

export type TodoDto = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export function mapTodoToDto(row: TodoRow): TodoDto {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    createdAt: row.createdAt.toISOString(),
  };
}
