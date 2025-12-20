import { db } from './connection.ts'
import {
    users,
    teams,
    collaborators,
    collaboratorsTeamAssignments,
    roles,
    events,
    eventInstances,
    eventInstanceRoles,
    eventRoleAssignments,
    notifications,
    permissions,
    auditLogs
} from './schema.ts'

const seed = async () => {
    console.log('🌱 Start database seed...')
    try {
        // Deletar na ordem inversa das dependências (foreign keys)
        console.log('🗑️ Deleting existing data...')
        await db.delete(auditLogs)
        await db.delete(notifications)
        await db.delete(eventRoleAssignments)
        await db.delete(eventInstanceRoles)
        await db.delete(eventInstances)
        await db.delete(events)
        await db.delete(collaboratorsTeamAssignments)
        await db.delete(collaborators)
        await db.delete(roles)
        await db.delete(teams)
        await db.delete(permissions)
        await db.delete(users)

        console.log('📝 Inserting seed data...')

        // 1. Criar usuário admin (ele é criado por si mesmo)
        const [adminUser] = await db.insert(users).values({
            email: 'admin@levita.app',
            passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // hash fictício
            name: 'Administrador',
            role: 'ADMIN',
            status: 'ACTIVE',
            createdByID: '00000000-0000-0000-0000-000000000000', // placeholder temporário
        }).returning()

        // Atualizar o createdByID do admin para si mesmo
        await db.update(users)
            .set({ createdByID: adminUser.id })
            .where(eq(users.id, adminUser.id))

        // 2. Criar mais usuários
        const [managerUser] = await db.insert(users).values({
            email: 'gerente@levita.app',
            passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            name: 'João Gerente',
            role: 'MANAGER',
            status: 'ACTIVE',
            createdByID: adminUser.id,
        }).returning()

        const [teamLeaderUser] = await db.insert(users).values({
            email: 'lider@levita.app',
            passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            name: 'Maria Líder',
            role: 'TEAM_LEADER',
            status: 'ACTIVE',
            createdByID: adminUser.id,
        }).returning()

        console.log('✅ Users created')

        // 3. Criar times
        const [worshipTeam] = await db.insert(teams).values({
            name: 'Ministério de Louvor',
            description: 'Time responsável pelo louvor e adoração',
            leaderId: teamLeaderUser.id,
            createdById: adminUser.id,
            status: 'ACTIVE',
        }).returning()

        const [techTeam] = await db.insert(teams).values({
            name: 'Ministério de Mídia',
            description: 'Time responsável por som, projeção e transmissão',
            leaderId: managerUser.id,
            createdById: adminUser.id,
            status: 'ACTIVE',
        }).returning()

        console.log('✅ Teams created')

        // 4. Criar colaboradores
        const [collaborator1] = await db.insert(collaborators).values({
            name: 'Pedro Silva',
            email: 'pedro@email.com',
            phone: '11999990001',
            createdById: adminUser.id,
            status: 'ACTIVE',
        }).returning()

        const [collaborator2] = await db.insert(collaborators).values({
            name: 'Ana Santos',
            email: 'ana@email.com',
            phone: '11999990002',
            createdById: adminUser.id,
            status: 'ACTIVE',
        }).returning()

        const [collaborator3] = await db.insert(collaborators).values({
            name: 'Lucas Oliveira',
            email: 'lucas@email.com',
            phone: '11999990003',
            createdById: teamLeaderUser.id,
            status: 'ACTIVE',
        }).returning()

        console.log('✅ Collaborators created')

        // 5. Criar roles (funções nos eventos)
        const [vocalRole] = await db.insert(roles).values({
            name: 'Vocal',
            description: 'Cantor ou backing vocal',
            createdById: adminUser.id,
        }).returning()

        const [guitarRole] = await db.insert(roles).values({
            name: 'Guitarrista',
            description: 'Tocador de guitarra ou violão',
            createdById: adminUser.id,
        }).returning()

        const [soundRole] = await db.insert(roles).values({
            name: 'Operador de Som',
            description: 'Responsável pela mesa de som',
            createdById: adminUser.id,
        }).returning()

        console.log('✅ Roles created')

        // 6. Atribuir colaboradores aos times
        await db.insert(collaboratorsTeamAssignments).values([
            { collaboratorId: collaborator1.id, teamId: worshipTeam.id },
            { collaboratorId: collaborator2.id, teamId: worshipTeam.id },
            { collaboratorId: collaborator3.id, teamId: techTeam.id },
        ])

        console.log('✅ Team assignments created')

        // 7. Criar eventos
        const [sundayEvent] = await db.insert(events).values({
            title: 'Culto de Domingo',
            description: 'Culto dominical às 19h',
            isRecurring: true,
            recurrenceRule: {
                frequency: 'WEEKLY',
                day_of_week: 'SUNDAY',
                start_date: '2025-01-05',
                interval: 1,
            },
            notificationDeadlineDays: 3,
            createdById: adminUser.id,
            status: 'PUBLISHED',
        }).returning()

        const [wednesdayEvent] = await db.insert(events).values({
            title: 'Culto de Quarta',
            description: 'Culto de oração e estudo',
            isRecurring: true,
            recurrenceRule: {
                frequency: 'WEEKLY',
                day_of_week: 'WEDNESDAY',
                start_date: '2025-01-08',
                interval: 1,
            },
            notificationDeadlineDays: 2,
            createdById: adminUser.id,
            status: 'PUBLISHED',
        }).returning()

        console.log('✅ Events created')

        // 8. Criar instâncias de eventos
        const [sundayInstance1] = await db.insert(eventInstances).values({
            eventId: sundayEvent.id,
            scheduledDate: new Date('2025-01-05'),
            start_time: new Date('2025-01-05T19:00:00'),
            end_time: new Date('2025-01-05T21:00:00'),
            location: 'Templo Principal',
            status: 'SCHEDULED',
        }).returning()

        const [sundayInstance2] = await db.insert(eventInstances).values({
            eventId: sundayEvent.id,
            scheduledDate: new Date('2025-01-12'),
            start_time: new Date('2025-01-12T19:00:00'),
            end_time: new Date('2025-01-12T21:00:00'),
            location: 'Templo Principal',
            status: 'SCHEDULED',
        }).returning()

        console.log('✅ Event instances created')

        // 9. Criar roles necessários para as instâncias
        const [instanceRole1] = await db.insert(eventInstanceRoles).values({
            eventInstanceId: sundayInstance1.id,
            roleId: vocalRole.id,
            requiredCount: 2,
            filledCount: 0,
            status: 'OPEN',
        }).returning()

        const [instanceRole2] = await db.insert(eventInstanceRoles).values({
            eventInstanceId: sundayInstance1.id,
            roleId: guitarRole.id,
            requiredCount: 1,
            filledCount: 0,
            status: 'OPEN',
        }).returning()

        const [instanceRole3] = await db.insert(eventInstanceRoles).values({
            eventInstanceId: sundayInstance1.id,
            roleId: soundRole.id,
            requiredCount: 1,
            filledCount: 0,
            status: 'OPEN',
        }).returning()

        console.log('✅ Event instance roles created')

        // 10. Criar atribuições de colaboradores aos eventos
        const responseDeadline = new Date('2025-01-03')

        const [assignment1] = await db.insert(eventRoleAssignments).values({
            eventInstanceRoleId: instanceRole1.id,
            collaboratorId: collaborator1.id,
            teamId: worshipTeam.id,
            assignmentStatus: 'ACCEPTED',
            responseDeadline,
        }).returning()

        const [assignment2] = await db.insert(eventRoleAssignments).values({
            eventInstanceRoleId: instanceRole1.id,
            collaboratorId: collaborator2.id,
            teamId: worshipTeam.id,
            assignmentStatus: 'PENDING',
            responseDeadline,
        }).returning()

        const [assignment3] = await db.insert(eventRoleAssignments).values({
            eventInstanceRoleId: instanceRole3.id,
            collaboratorId: collaborator3.id,
            teamId: techTeam.id,
            assignmentStatus: 'ACCEPTED',
            responseDeadline,
        }).returning()

        console.log('✅ Event role assignments created')

        // 11. Criar notificações
        await db.insert(notifications).values([
            {
                eventRoleAssignmentId: assignment1.id,
                collaboratorId: collaborator1.id,
                messageContent: 'Olá Pedro! Você foi escalado como Vocal para o Culto de Domingo dia 05/01. Confirme sua presença.',
                responseStatus: 'ACCEPTED',
                reponseReceivedAt: new Date('2025-01-02T10:00:00'),
                whatsappMessageId: 'wamid.XXX001',
            },
            {
                eventRoleAssignmentId: assignment2.id,
                collaboratorId: collaborator2.id,
                messageContent: 'Olá Ana! Você foi escalada como Vocal para o Culto de Domingo dia 05/01. Confirme sua presença.',
                responseStatus: 'PENDING',
                whatsappMessageId: 'wamid.XXX002',
            },
            {
                eventRoleAssignmentId: assignment3.id,
                collaboratorId: collaborator3.id,
                messageContent: 'Olá Lucas! Você foi escalado como Operador de Som para o Culto de Domingo dia 05/01. Confirme sua presença.',
                responseStatus: 'ACCEPTED',
                reponseReceivedAt: new Date('2025-01-02T14:30:00'),
                whatsappMessageId: 'wamid.XXX003',
            },
        ])

        console.log('✅ Notifications created')

        // 12. Criar permissões básicas
        await db.insert(permissions).values({
            role: 'ADMIN',
            resource: 'all',
            action: 'CREATE',
        })

        console.log('✅ Permissions created')

        // 13. Criar log de auditoria
        await db.insert(auditLogs).values({
            userId: adminUser.id,
            resourceType: 'users',
            resourceId: managerUser.id,
            action: 'CREATE',
            oldValue: null,
            newValue: { email: managerUser.email, name: managerUser.name },
            ipAddress: '127.0.0.1',
        })

        console.log('✅ Audit logs created')

        console.log('🎉 Database seed completed successfully!')

    } catch (error) {
        console.error('❌ Seed error:', error)
        throw error
    }
}

// Importar eq para o update
import { eq } from 'drizzle-orm'

seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))