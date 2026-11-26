import { request } from "../../../shared/api/client";
import type {
  CatalogWrite,
  GradeCreate,
  GradeMove,
  GradeRemove,
  GradeRename,
  ResourceCreated,
  SchoolWrite,
} from "../../../shared/api/contracts";

export function updateSchool(body: SchoolWrite) {
  return request<void, SchoolWrite>("/api/school", { method: "PUT", body });
}

export function createGrade(body: GradeCreate) {
  return request<ResourceCreated, GradeCreate>("/api/grades", { method: "POST", body });
}

export function renameGrade(id: string, body: GradeRename) {
  return request<void, GradeRename>(`/api/grades/${id}`, { method: "PUT", body });
}

export function moveGrade(id: string, body: GradeMove) {
  return request<void, GradeMove>(`/api/grades/${id}/move`, { method: "POST", body });
}

export function removeGrade(id: string, body: GradeRemove) {
  return request<void, GradeRemove>(`/api/grades/${id}/remove`, { method: "POST", body });
}

export function createCatalogItem(body: CatalogWrite) {
  return request<ResourceCreated, CatalogWrite>("/api/catalog", { method: "POST", body });
}

export function updateCatalogItem(id: string, body: CatalogWrite) {
  return request<void, CatalogWrite>(`/api/catalog/${id}`, { method: "PUT", body });
}

export function deleteCatalogItem(id: string) {
  return request<void>(`/api/catalog/${id}`, { method: "DELETE" });
}
