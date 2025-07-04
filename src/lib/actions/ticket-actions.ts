// src/lib/actions/ticket-actions.ts
'use server';

import type { ServiceTicket, SupportTicket } from '@/types';
import {
  serviceTicketFormSchema,
  type ServiceTicketFormValues,
  supportTicketFormSchema,
  type SupportTicketFormValues,
} from '../schemas';
import { getUserById } from '../auth';
import { hasRole } from '../auth-utils';
import { checkPermission, PermissionError } from '../permissions';
import { UserRoles } from '../constants';
import { serviceTickets as mockServiceTickets } from '../service-ticket-data';
import { supportTickets as mockSupportTickets } from '../support-ticket-data';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';

export async function getServiceTickets(
  userId?: string,
  filters?: { productionLineId?: string },
): Promise<ServiceTicket[]> {
  if (!userId) return Promise.resolve(mockServiceTickets);

  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const canViewAll =
    hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.MANUFACTURER);

  if (canViewAll || hasRole(user, UserRoles.SERVICE_PROVIDER)) {
    let results = [...mockServiceTickets];

    if (!canViewAll && hasRole(user, UserRoles.SERVICE_PROVIDER)) {
      results = results.filter(t => t.userId === user.id);
    }

    if (filters?.productionLineId) {
      results = results.filter(
        t => t.productionLineId === filters.productionLineId,
      );
    }

    return Promise.resolve(
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }

  return Promise.resolve([]);
}

export async function saveServiceTicket(
  values: ServiceTicketFormValues,
  userId: string,
  ticketId?: string,
): Promise<ServiceTicket> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'ticket:manage');

  const validatedData = serviceTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedTicket: ServiceTicket;

  const ticketData = {
    productId: validatedData.productId,
    productionLineId: validatedData.productionLineId,
    customerName: validatedData.customerName,
    issue: validatedData.issue,
    status: validatedData.status,
    imageUrl: validatedData.imageUrl,
    userId,
  };

  if (ticketId) {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) throw new Error('Ticket not found');
    savedTicket = {
      ...mockServiceTickets[ticketIndex],
      ...ticketData,
      updatedAt: now,
    };
    mockServiceTickets[ticketIndex] = savedTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = {
      id: newId('tkt'),
      ...ticketData,
      createdAt: now,
      updatedAt: now,
    };
    mockServiceTickets.unshift(savedTicket);
    await logAuditEvent('ticket.created', savedTicket.id, {}, userId);
  }
  return Promise.resolve(savedTicket);
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'ticket:manage');

  const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) throw new Error('Ticket not found');
  mockServiceTickets[ticketIndex].status = status;
  mockServiceTickets[ticketIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  return Promise.resolve(mockServiceTickets[ticketIndex]);
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  return Promise.resolve(mockSupportTickets);
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: 'Open' | 'Closed',
  userId: string,
): Promise<SupportTicket> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'support:manage');

  const ticketIndex = mockSupportTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) throw new Error('Support ticket not found.');

  mockSupportTickets[ticketIndex].status = status;
  mockSupportTickets[ticketIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'support_ticket.status_updated',
    ticketId,
    { status },
    userId,
  );
  return Promise.resolve(mockSupportTickets[ticketIndex]);
}

export async function saveSupportTicket(
  values: SupportTicketFormValues,
  userId?: string,
): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: newId('spt'),
    ...values,
    userId,
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };
  mockSupportTickets.unshift(newTicket);
  await logAuditEvent(
    'support_ticket.created',
    newTicket.id,
    {},
    userId || 'guest',
  );
  return newTicket;
}
