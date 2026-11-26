import { request } from "../../../shared/api/client";
import type {
  AssignmentWrite,
  AttendanceWrite,
  GroupVersion,
  GroupWrite,
  KeepStudentWrite,
  MoveStudentWrite,
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

export function moveStudent(groupId: string, body: MoveStudentWrite) {
  return request<void, MoveStudentWrite>(`/api/groups/${groupId}/move`, { method: "POST", body });
}

export function keepStudent(groupId: string, body: KeepStudentWrite) {
  return request<void, KeepStudentWrite>(`/api/groups/${groupId}/keep`, { method: "POST", body });
}

export function archiveGroup(id: string, body: GroupVersion) {
  return request<void, GroupVersion>(`/api/groups/${id}/archive`, { method: "POST", body });
}

export function restoreGroup(id: string, body: GroupVersion) {
  return request<void, GroupVersion>(`/api/groups/${id}/restore`, { method: "POST", body });
}

export function deleteGroup(id: string) {
  return request<void>(`/api/groups/${id}`, { method: "DELETE" });
}

export function finishSession(sessionId: string) {
  return request<void>(`/api/sessions/${sessionId}/finish`, { method: "POST" });
}
