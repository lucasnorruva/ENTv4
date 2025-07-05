// src/lib/actions/ticket-actions.ts
'use server';

import type { ServiceTicket, SupportTicket, Product, User } from '@/types';
import {
  serviceTicketFormSchema,
  type ServiceTicketFormValues,
  supportTicketFormSchema,
  type SupportTicketFormValues,
} from '../schemas';
import { getUserById } from '../auth';
import { checkPermission, PermissionError } from '../permissions';
import { UserRoles } from '../constants';
import { serviceTickets as mockServiceTickets } from '../service-ticket-data';
import { supportTickets as mockSupportTickets } from '../support-ticket-data';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { getProducts } from './product-actions';
import { getProductionLines } from './manufacturing-actions';

export async function getServiceTickets(
  userId: string,
  filters?: { productionLineId?: string },
): Promise<ServiceTicket[]> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  let results = [...mockServiceTickets];

  // Admins and Service Providers see all tickets
  if (
    user.roles.includes(UserRoles.ADMIN) ||
    user.roles.includes(UserRoles.SERVICE_PROVIDER)
  ) {
    // No company filtering
  } else if (user.roles.includes(UserRoles.MANUFACTURER)) {
    // Manufacturers see tickets for their company's products/lines.
    const companyProducts = (await getProducts(user.id)).map(p => p.id);
    const companyLines = (await getProductionLines()).filter(
      l => l.companyId === user.companyId,
    ).map(l => l.id);

    results = results.filter(
      t =>
        (t.productId && companyProducts.includes(t.productId)) ||
        (t.productionLineId && companyLines.includes(t.productionLineId)),
    );
  } else {
    // Other roles see no tickets by default.
    return [];
  }

  // Apply additional filters
  if (filters?.productionLineId) {
    results = results.filter(
      t => t.productionLineId === filters.productionLineId,
    );
  }

  return Promise.resolve(results);
}


export async function getServiceTicketById(
  ticketId: string,
  userId: string,
): Promise<ServiceTicket | undefined> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  
  // A simple check; in a real app, you'd check if the user's company
  // owns the product/line associated with the ticket.
  // For this mock, we allow broader access for relevant roles.
  const canViewAll =
    user.roles.includes(UserRoles.ADMIN) ||
    user.roles.includes(UserRoles.SERVICE_PROVIDER) ||
    user.roles.includes(UserRoles.MANUFACTURER);
  
  if (!canViewAll) {
    throw new PermissionError('You do not have permission to view this ticket.');
  }

  return Promise.resolve(mockServiceTickets.find(t => t.id === ticketId));
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

  if (ticketId) {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) throw new Error('Ticket not found');
    savedTicket = {
      ...mockServiceTickets[ticketIndex],
      ...validatedData,
      userId,
      updatedAt: now,
    };
    mockServiceTickets[ticketIndex] = savedTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = {
      id: newId('tkt'),
      ...validatedData,
      userId,
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
