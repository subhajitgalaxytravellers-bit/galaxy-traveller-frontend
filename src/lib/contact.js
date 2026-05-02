import { post } from "@/api/client";
import { useMutation } from "@tanstack/react-query";

export const useCreateLead = () =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await post("/lead", payload);
        return res.data;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";
        throw new Error(message);
      }
    },
  });
