import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { todos, type NewTodoRow, type TodoRow } from "../db/schema.js";

export class TodoRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<TodoRow[]> {
    return this.db.select().from(todos).orderBy(desc(todos.createdAt));
  }

  async findById(id: string): Promise<TodoRow | undefined> {
    const rows = await this.db.select().from(todos).where(eq(todos.id, id)).limit(1);
    return rows[0];
  }

  async insert(row: NewTodoRow): Promise<TodoRow> {
    const inserted = await this.db.insert(todos).values(row).returning();
    return inserted[0]!;
  }

  async updateDone(id: string, done: boolean): Promise<TodoRow | undefined> {
    const updated = await this.db
      .update(todos)
      .set({ done, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning();
    return updated[0];
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.db.delete(todos).where(eq(todos.id, id)).returning();
    return result.length > 0;
  }

  async clearAll(): Promise<void> {
    await this.db.delete(todos);
  }
}
