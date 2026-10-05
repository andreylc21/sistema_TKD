import { request } from "../../../shared/api/client";
import type {
  AssignmentWrite,
  AttendanceWrite,
  GroupWrite,
  ParticipantWrite,
  ResourceCreated,
  SessionStatusWrite,
  SessionWrite,
} from "../../../shared/api/contracts";

export function createGroup(body: GroupWrite, idempotencyKey: string) {
  return request<ResourceCreated, GroupWrite>("/api/groups", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function updateGroup(id: string, body: GroupWrite) {
  return request<void, GroupWrite>(`/api/groups/${id}`, { method: "PUT", body });
}

export function assignStudent(groupId: string, body: AssignmentWrite) {
  return request<void, AssignmentWrite>(`/api/groups/${groupId}/assignments`, {
    method: "POST",
    body,
  });
}

export function createSession(body: SessionWrite, idempotencyKey: string) {
  return request<ResourceCreated, SessionWrite>("/api/sessions", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function inviteParticipant(sessionId: string, body: ParticipantWrite) {
  return request<void, ParticipantWrite>(`/api/sessions/${sessionId}/participants`, {
    method: "POST",
    body,
  });
}

export function updateAttendance(sessionId: string, studentId: string, body: AttendanceWrite) {
  return request<void, AttendanceWrite>(`/api/sessions/${sessionId}/attendance/${studentId}`, {
    method: "PUT",
    body,
  });
}

export function updateSessionStatus(sessionId: string, body: SessionStatusWrite) {
  return request<void, SessionStatusWrite>(`/api/sessions/${sessionId}/status`, {
    method: "PUT",
    body,
  });
}
