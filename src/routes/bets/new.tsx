import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	BetForm,
	fromDatetimeLocal,
	toDatetimeLocal,
} from "#/components/BetForm";
import { authSession, betsCreate } from "#/lib/server-functions";

export const Route = createFileRoute("/bets/new")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: NewBetPage,
});

function NewBetPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const createMutation = useMutation({
		mutationFn: betsCreate,
		onSuccess: async (bet) => {
			setErrorMessage(null);
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			navigate({ to: "/bets/$betId", params: { betId: bet.id } });
		},
		onError: (error) => {
			setErrorMessage(error.message || "Nao foi possivel criar a bet.");
		},
	});

	return (
		<main className="page-wrap py-10">
			<BetForm
				mode="create"
				busy={createMutation.isPending}
				errorMessage={errorMessage}
				defaultValues={{
					sport: "",
					market: "",
					eventName: "",
					selection: "",
					bookmaker: "",
					oddsDecimal: 1.9,
					stakeAmount: 100,
					placedAt: toDatetimeLocal(),
					note: "",
					tagsText: "",
				}}
				onSubmit={async (values) => {
					setErrorMessage(null);
					await createMutation.mutateAsync({
						data: {
							...values,
							placedAt: fromDatetimeLocal(values.placedAt),
						},
					});
				}}
			/>
		</main>
	);
}
