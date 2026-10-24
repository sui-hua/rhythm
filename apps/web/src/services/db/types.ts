export type EntityId = string | number

export type GoalStatus = 'active' | 'completed' | 'archived'

export type TaskStatus = 'inbox' | 'scheduled' | 'completed' | 'archived'

export type SummaryKind = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue
}
