"use server";

import * as referenceService from "./quotation/quotation-reference.service";
import * as listService from "./quotation/quotation-list.service";
import * as finalizeService from "./quotation/quotation-finalize.service";

export async function getQuotationReferenceData() {
  return referenceService.getQuotationReferenceData();
}

export async function getHotelsByCity(cityId: string) {
  return referenceService.getHotelsByCity(cityId);
}

export async function getServices() {
  return referenceService.getServices();
}

export async function getServiceProviders() {
  return referenceService.getServiceProviders();
}

export async function getOtherServices() {
  return referenceService.getOtherServices();
}

export async function getQuotations(options?: listService.QuotationListOptions) {
  return listService.getQuotations(options);
}

export async function updateQuotationStatus(quotationId: string, status: string) {
  return listService.updateQuotationStatus(quotationId, status);
}

export async function finalizeQuotation(
  quotationId: string,
  data: finalizeService.FinalizeQuotationData,
  state?: finalizeService.QuotationState
) {
  return finalizeService.finalizeQuotation(quotationId, data, state);
}
