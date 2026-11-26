import { request } from "../../../shared/api/client";
import type {
  ExamEnrollWrite,
  ExamResultWrite,
  ExamUpdate,
  ExamWrite,
  ResourceCreated,
} from "../../../shared/api/contracts";

export function createExam(body: ExamWrite, idempotencyKey: string) {
  return request<ResourceCreated, ExamWrite>("/api/exams", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function updateExam(examId: string, body: ExamUpdate) {
  return request<void, ExamUpdate>(`/api/exams/${examId}`, { method: "PUT", body });
}

export function enrollExam(examId: string, body: ExamEnrollWrite) {
  return request<ResourceCreated, ExamEnrollWrite>(`/api/exams/${examId}/entries`, {
    method: "POST",
    body,
  });
}

export function removeExamEntry(examId: string, entryId: string) {
  return request<void>(`/api/exams/${examId}/entries/${entryId}`, { method: "DELETE" });
}

export function setExamResult(examId: string, entryId: string, body: ExamResultWrite) {
  return request<void, ExamResultWrite>(`/api/exams/${examId}/entries/${entryId}/result`, {
    method: "PUT",
    body,
  });
}
