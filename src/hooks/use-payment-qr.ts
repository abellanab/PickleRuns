"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPostForm } from "@/lib/api/client";

interface PaymentQr {
  paymentQrUrl: string | null;
}

const paymentQrKey = (code: string) => ["payment-qr", code] as const;

export function usePaymentQr(code: string) {
  return useQuery({
    queryKey: paymentQrKey(code),
    queryFn: () => apiGet<PaymentQr>(`/api/runs/${code}/payment`),
    enabled: !!code,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

function useSyncPaymentQr(code: string) {
  const queryClient = useQueryClient();
  return (data: PaymentQr) => {
    queryClient.setQueryData<PaymentQr>(paymentQrKey(code), { paymentQrUrl: data.paymentQrUrl });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["host-status"] });
  };
}

export function useUploadPaymentQrMutation(code: string) {
  const sync = useSyncPaymentQr(code);
  return useMutation({
    mutationFn: (image: Blob) => {
      const formData = new FormData();
      formData.append("file", image, "payment-qr.png");
      return apiPostForm<PaymentQr>("/api/users/me/payment-qr", formData);
    },
    onSuccess: sync,
  });
}

export function useRemovePaymentQrMutation(code: string) {
  const sync = useSyncPaymentQr(code);
  return useMutation({
    mutationFn: () => apiDelete<PaymentQr>("/api/users/me/payment-qr"),
    onSuccess: sync,
  });
}
