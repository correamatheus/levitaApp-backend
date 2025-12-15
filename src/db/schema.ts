import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
    pgEnum,
    jsonb,
    type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { create } from 'domain'
import { id } from 'zod/locales'

export const rolesEnum = pgEnum('roles', [
    'ADMIN',
    'USER',
    'TEAM_LEADER',
    'MANAGER'
]) 
export const statusEnum = pgEnum('status', [
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
])
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255}).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 100}).notNull(),
    role: rolesEnum('role').notNull().default('USER'),
    status: statusEnum('status').notNull().default('ACTIVE'),
    createdByID: uuid('created_by_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teams = pgTable('teams', {
    id: uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', { length: 255}).notNull(),
    description: text('description'),
    leaderId: uuid('leader_id').notNull().references(() : AnyPgColumn => users.id),
    createdById: uuid('created_by_id').notNull(),
    status: statusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const collaborators = pgTable('collaborators', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255}).notNull(),
    email: varchar('email', { length: 255}).notNull().unique(),
    phone: varchar('phone', { length: 20}),
    createdById: uuid('created_by_id').notNull().references(() : AnyPgColumn => users.id),
    status: statusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const collaboratorsTeamAssignments = pgTable('collaborators_team_assignments', {})

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100}).notNull().unique(),
    description: text('description'),
    createdById: uuid('created_by_id').notNull().references(() : AnyPgColumn => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const eventStatusEnum = pgEnum('event_status', [
    'DRAFT',
    'PUBLISHED',
    'CANCELLED',
])

// Tipo para a regra de recorrência
export type RecurrenceRule = {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    day_of_week?: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'
    start_date: string // formato: "YYYY-MM-DD"
    end_date?: string  // formato: "YYYY-MM-DD"
    interval: number   // a cada X dias/semanas/meses
}

export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255}).notNull(),
    description: text('description'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: jsonb('recurrence_rule').$type<RecurrenceRule>(),
    notificationDeadlineDays: integer('notification_deadline_days'),
    createdById: uuid('created_by_id').notNull().references(() : AnyPgColumn => users.id),
    status: eventStatusEnum('status').notNull().default('DRAFT'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const eventStatusInstances = pgEnum('event_instance_status', [
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'IN_PROGRESS',
])

export const eventInstances = pgTable('event_instances', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull().references(() : AnyPgColumn => events.id),
    scheduledDate: timestamp('scheduled_date').notNull(),
    start_time: timestamp('start_time').notNull(),
    end_time: timestamp('end_time').notNull(),
    location: varchar('location', { length: 255}),
    status: eventStatusInstances('status').notNull().default('SCHEDULED'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

const eventStatusInstanceRoles = pgEnum('event_instance_role_status', [
    'OPEN',
    'FILLED',
    'PARTIAL',
])

export const eventInstanceRoles = pgTable('event_instance_roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventInstanceId: uuid('event_instance_id').notNull().references(() : AnyPgColumn => eventInstances.id),
    roleId: uuid('role_id').notNull().references(() : AnyPgColumn => roles.id),
    requiredCount: integer('required_count').notNull().default(1),
    filledCount: integer('filled_count').notNull().default(0),
    status: eventStatusInstanceRoles('status').notNull().default('OPEN'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})


const eventAssignmentsEnum = pgEnum('assignment_status', [
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'NO_RESPONSE'
])


export const eventRoleAssignments = pgTable('event_role_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventInstanceRoleId: uuid('event_instance_role_id').notNull().references(() : AnyPgColumn => eventInstanceRoles.id),
    collaboratorId: uuid('collaborator_id').notNull().references(() : AnyPgColumn => collaborators.id),
    teamId: uuid('team_id').notNull().references(() : AnyPgColumn => teams.id),
    assignmentStatus: eventAssignmentsEnum('assignment_status').notNull().default('PENDING'),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
    responseDeadline: timestamp('response_deadline').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Controle de notificações enviadas via WhatsApp
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventRoleAssignmentId: uuid('event_role_assignment_id').notNull().references(() : AnyPgColumn => eventRoleAssignments.id),
    collaboratorId: uuid('collaborator_id').notNull().references(() : AnyPgColumn => collaborators.id),
    messageContent: text('message_content').notNull(),
    sentAt: timestamp('sent_at').notNull().defaultNow(),
    responseStatus: eventAssignmentsEnum('assignment_status').notNull().default('PENDING'),
    reponseReceivedAt: timestamp('response_received_at'),
    whatsappMessageId: varchar('whatsapp_message_id', { length: 100}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

const actionEnum = pgEnum('action_enum', [
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
])

// Define o que cada tipo de usuário pode fazer
export const permissions = pgTable('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    role: rolesEnum('role').notNull().unique(),
    resource: varchar('resource', { length: 100}).notNull().unique(),
    action: actionEnum('action').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() : AnyPgColumn => users.id),
    resourceType: varchar('resource_type', { length: 100}).notNull(),
    resourceId: uuid('resource_id').notNull(),
    action: actionEnum('action').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    ipAddress: varchar('ip_address', { length: 45}),
})