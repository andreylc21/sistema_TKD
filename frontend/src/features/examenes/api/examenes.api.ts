import { request } from "../../../shared/api/client";
import type {
  ExamEnrollWrite,
  ExamExceptionWrite,
  ExamResultWrite,
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

export function authorizeExamPayment(examId: string, entryId: string, body: ExamExceptionWrite) {
  return request<void, ExamExceptionWrite>(`/api/exams/${examId}/entries/${entryId}/exception`, {
    method: "POST",
    body,
  });
}
