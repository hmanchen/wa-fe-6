"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  type GetCasesParams,
  type CreateCaseData,
  type UpdateCaseData,
} from "@/lib/api/cases";

export const CASES_QUERY_KEY = ["cases"] as const;
export const CASE_QUERY_KEY = (id: string) => ["cases", id] as const;

export function useCases(params?: GetCasesParams) {
  return useQuery({
    queryKey: [...CASES_QUERY_KEY, params],
    queryFn: () => getCases(params),
  });
}

export function useCase(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? CASE_QUERY_KEY(id) : ["cases", "none"],
    queryFn: () => getCase(id!),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCaseData) => createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCaseData }) =>
      updateCase(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEY(variables.id),
      });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
    },
  });
}
