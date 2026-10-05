import { request } from "../../../shared/api/client";
import type {
  NoteWrite,
  ResourceCreated,
  StudentStatusWrite,
  StudentWrite,
} from "../../../shared/api/contracts";

export function createStudent(body: StudentWrite, idempotencyKey: string) {
  return request<ResourceCreated, StudentWrite>("/api/students", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function updateStudent(id: string, body: StudentWrite) {
  return request<void, StudentWrite>(`/api/students/${id}`, { method: "PUT", body });
}

export function changeStudentStatus(id: string, body: StudentStatusWrite) {
  return request<void, StudentStatusWrite>(`/api/students/${id}/status`, {
    method: "POST",
    body,
  });
}

export function createNote(studentId: string, body: NoteWrite, idempotencyKey: string) {
  return request<ResourceCreated, NoteWrite>(`/api/students/${studentId}/notes`, {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function updateNote(id: string, body: NoteWrite) {
  return request<void, NoteWrite>(`/api/notes/${id}`, { method: "PUT", body });
}

export function deleteNote(id: string, version: number) {
  return request<void>(`/api/notes/${id}?version=${encodeURIComponent(version)}`, {
    method: "DELETE",
  });
}
