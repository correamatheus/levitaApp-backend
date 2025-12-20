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
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const rolesEnum = pgEnum('user_role', [
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

export const actionEnum = pgEnum('action_enum', [
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
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

export const collaboratorsTeamAssignments = pgTable('collaborators_team_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    collaboratorId: uuid('collaborator_id').notNull().references(() : AnyPgColumn => collaborators.id),
    teamId: uuid('team_id').notNull().references(() : AnyPgColumn => teams.id),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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

export const eventStatusInstanceRoles = pgEnum('event_instance_role_status', [
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


export const eventAssignmentsEnum = pgEnum('assignment_status', [
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

// ==========================================
// RELACIONAMENTOS (Relations)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
    ledTeams: many(teams),
    createdCollaborators: many(collaborators),
    createdEvents: many(events),
    createdRoles: many(roles),
    auditLogs: many(auditLogs),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
    leader: one(users, {
        fields: [teams.leaderId],
        references: [users.id],
    }),
    collaboratorAssignments: many(collaboratorsTeamAssignments),
    eventRoleAssignments: many(eventRoleAssignments),
}))

export const collaboratorsRelations = relations(collaborators, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [collaborators.createdById],
        references: [users.id],
    }),
    teamAssignments: many(collaboratorsTeamAssignments),
    eventRoleAssignments: many(eventRoleAssignments),
    notifications: many(notifications),
}))

export const collaboratorsTeamAssignmentsRelations = relations(collaboratorsTeamAssignments, ({ one }) => ({
    collaborator: one(collaborators, {
        fields: [collaboratorsTeamAssignments.collaboratorId],
        references: [collaborators.id],
    }),
    team: one(teams, {
        fields: [collaboratorsTeamAssignments.teamId],
        references: [teams.id],
    }),
}))

export const rolesRelations = relations(roles, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [roles.createdById],
        references: [users.id],
    }),
    eventInstanceRoles: many(eventInstanceRoles),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [events.createdById],
        references: [users.id],
    }),
    instances: many(eventInstances),
}))

export const eventInstancesRelations = relations(eventInstances, ({ one, many }) => ({
    event: one(events, {
        fields: [eventInstances.eventId],
        references: [events.id],
    }),
    roles: many(eventInstanceRoles),
}))

export const eventInstanceRolesRelations = relations(eventInstanceRoles, ({ one, many }) => ({
    eventInstance: one(eventInstances, {
        fields: [eventInstanceRoles.eventInstanceId],
        references: [eventInstances.id],
    }),
    role: one(roles, {
        fields: [eventInstanceRoles.roleId],
        references: [roles.id],
    }),
    assignments: many(eventRoleAssignments),
}))

export const eventRoleAssignmentsRelations = relations(eventRoleAssignments, ({ one, many }) => ({
    eventInstanceRole: one(eventInstanceRoles, {
        fields: [eventRoleAssignments.eventInstanceRoleId],
        references: [eventInstanceRoles.id],
    }),
    collaborator: one(collaborators, {
        fields: [eventRoleAssignments.collaboratorId],
        references: [collaborators.id],
    }),
    team: one(teams, {
        fields: [eventRoleAssignments.teamId],
        references: [teams.id],
    }),
    notifications: many(notifications),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
    eventRoleAssignment: one(eventRoleAssignments, {
        fields: [notifications.eventRoleAssignmentId],
        references: [eventRoleAssignments.id],
    }),
    collaborator: one(collaborators, {
        fields: [notifications.collaboratorId],
        references: [collaborators.id],
    }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}))

export type User = typeof users.$inferSelect
export type Team = typeof teams.$inferSelect
export type Collaborator = typeof collaborators.$inferSelect
export type Role = typeof roles.$inferSelect
export type Event = typeof events.$inferSelect
export type EventInstance = typeof eventInstances.$inferSelect
export type EventInstanceRole = typeof eventInstanceRoles.$inferSelect
export type EventRoleAssignment = typeof eventRoleAssignments.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
export type CollaboratorsTeamAssignment = typeof collaboratorsTeamAssignments.$inferSelect
export type Permission = typeof permissions.$inferSelect

export const insertUserSchema = createInsertSchema(users)
export const insertTeamSchema = createInsertSchema(teams)
export const insertCollaboratorSchema = createInsertSchema(collaborators)
export const insertRoleSchema = createInsertSchema(roles)
export const insertEventSchema = createInsertSchema(events)
export const insertEventInstanceSchema = createInsertSchema(eventInstances)
export const insertEventInstanceRoleSchema = createInsertSchema(eventInstanceRoles)
export const insertEventRoleAssignmentSchema = createInsertSchema(eventRoleAssignments)
export const insertNotificationSchema = createInsertSchema(notifications)
export const insertAuditLogSchema = createInsertSchema(auditLogs)
export const insertCollaboratorsTeamAssignmentSchema = createInsertSchema(collaboratorsTeamAssignments)
export const insertPermissionSchema = createInsertSchema(permissions)

export const selectUserSchema = createSelectSchema(users)
export const selectTeamSchema = createSelectSchema(teams)
export const selectCollaboratorSchema = createSelectSchema(collaborators)
export const selectRoleSchema = createSelectSchema(roles)
export const selectEventSchema = createSelectSchema(events)
export const selectEventInstanceSchema = createSelectSchema(eventInstances)
export const selectEventInstanceRoleSchema = createSelectSchema(eventInstanceRoles)
export const selectEventRoleAssignmentSchema = createSelectSchema(eventRoleAssignments)
export const selectNotificationSchema = createSelectSchema(notifications)
export const selectAuditLogSchema = createSelectSchema(auditLogs)
export const selectCollaboratorsTeamAssignmentSchema = createSelectSchema(collaboratorsTeamAssignments)
export const selectPermissionSchema = createSelectSchema(permissions)