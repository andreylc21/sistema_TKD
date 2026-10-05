import { request } from "../../../shared/api/client";
import type {
  DiscountWrite,
  OrderBulkProgressWrite,
  OrderProgressWrite,
  OrderWrite,
  PaymentWrite,
  ResourceCreated,
  VoidPaymentWrite,
} from "../../../shared/api/contracts";

export function createPayment(body: PaymentWrite, idempotencyKey: string) {
  return request<ResourceCreated, PaymentWrite>("/api/payments", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function correctPayment(id: string, body: PaymentWrite) {
  return request<void, PaymentWrite>(`/api/payments/${id}`, { method: "PUT", body });
}

export function voidPayment(id: string, body: VoidPaymentWrite) {
  return request<void, VoidPaymentWrite>(`/api/payments/${id}/void`, {
    method: "POST",
    body,
  });
}

export function createDiscount(body: DiscountWrite) {
  return request<void, DiscountWrite>("/api/discounts", { method: "POST", body });
}

export function createOrder(body: OrderWrite, idempotencyKey: string) {
  return request<ResourceCreated, OrderWrite>("/api/orders", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export function updateOrderProgress(id: string, body: OrderProgressWrite) {
  return request<void, OrderProgressWrite>(`/api/order-items/${id}`, {
    method: "PUT",
    body,
  });
}

export function updateOrderProgressBulk(
  orderId: string,
  body: OrderBulkProgressWrite,
  idempotencyKey: string,
) {
  return request<void, OrderBulkProgressWrite>(`/api/orders/${orderId}/progress`, {
    method: "POST",
    body,
    idempotencyKey,
  });
}
